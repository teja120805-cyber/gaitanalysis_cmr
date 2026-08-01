/*
 * GaitGuard — ESP32 Smart Insole (direct WebSocket push)
 * ======================================================
 *
 * Keeps the original local HTTP monitor page (/ and /data) AND streams normalized
 * insole frames straight to the GaitGuard backend over a WebSocket
 * (/ws/ingest/insole) — no Python bridge needed.
 *
 * Frame shape (matches apps/web/src/lib/types.ts PoseFrame's sibling, InsoleFrame):
 *   { "t", "fsr": { "left":[heel,lat,med,toe], "right":[...] },
 *     "imu": { "ax","ay","az","gx","gy","gz" } }
 * FSR are normalized 0..1; accel in g; gyro in deg/s. The server stamps its own
 * receive time, so the ESP32 clock does not need NTP.
 *
 * LIBRARIES (Arduino Library Manager):
 *   - "WebSockets" by Markus Sattler   (arduinoWebSockets)
 *   - "ArduinoJson" by Benoit Blanchon
 *   - "MPU6050"    (I2Cdevlib / Electronic Cats — same as your original sketch)
 */

#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsClient.h>
#include <Wire.h>
#include <MPU6050.h>
#include <ArduinoJson.h>

// ================= CONFIG — EDIT THESE =================
const char* ssid     = "kkkk";              // WiFi / hotspot name
const char* password = "123456879";         // WiFi password

// The PC running the GaitGuard backend (same network). Get it from that PC.
const char* BACKEND_HOST = "192.168.1.100"; // <-- backend IP
const uint16_t BACKEND_PORT = 8000;

// Session + device token. Open the dashboard at:
//   http://<backend>:3000/monitor/pt-1042?session=pt-1042
const char* SESSION_ID   = "pt-1042";
const char* INGEST_TOKEN = "gaitguard-device-token";

// Which foot this single insole maps to: 0 = both (mirror), 1 = left, 2 = right
#define FOOT 0

const uint16_t SEND_INTERVAL_MS = 50;   // ~20 Hz — stable for ESP32 + WiFi
// ======================================================

WebServer server(80);
WebSocketsClient webSocket;
MPU6050 mpu;

// FSR pins
const int fsrHeel = 32;
const int fsrMet1 = 33;   // 1st metatarsal  -> medial
const int fsrMet5 = 34;   // 5th metatarsal  -> lateral
const int fsrToe  = 35;

const int ledPin = 26;
const int buzzerPin = 25;

int heel, met1, met5, toe;
int16_t ax, ay, az, gx, gy, gz;

bool wsConnected = false;
unsigned long lastSend = 0;

// ---------- scaling ----------
const float ADC_MAX   = 4095.0f;
const float ACCEL_LSB = 16384.0f;  // raw -> g   (±2 g)
const float GYRO_LSB  = 131.0f;    // raw -> °/s (±250 °/s)

// ==========================================
void readSensors() {
  heel = analogRead(fsrHeel);
  met1 = analogRead(fsrMet1);
  met5 = analogRead(fsrMet5);
  toe  = analogRead(fsrToe);
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

  // Local demo alert (unchanged)
  int total = heel + met1 + met5 + toe;
  digitalWrite(ledPin,    total > 8000 ? HIGH : LOW);
  digitalWrite(buzzerPin, total > 8000 ? HIGH : LOW);
}

// Build + send a GaitGuard insole frame over the WebSocket.
void sendInsoleFrame() {
  readSensors();

  // GaitGuard FSR order: [heel, lateral, medial, toe]
  float f[4] = {
    heel / ADC_MAX,
    met5 / ADC_MAX,   // lateral
    met1 / ADC_MAX,   // medial
    toe  / ADC_MAX
  };

  StaticJsonDocument<640> doc;
  doc["t"] = (double)millis();   // server overrides with receive time

  JsonObject fsr = doc.createNestedObject("fsr");
  JsonArray left  = fsr.createNestedArray("left");
  JsonArray right = fsr.createNestedArray("right");
  for (int i = 0; i < 4; i++) {
#if FOOT == 1            // left only
    left.add(f[i]);  right.add(0.0);
#elif FOOT == 2         // right only
    left.add(0.0);   right.add(f[i]);
#else                   // both (mirror single insole)
    left.add(f[i]);  right.add(f[i]);
#endif
  }

  JsonObject imu = doc.createNestedObject("imu");
  imu["ax"] = ax / ACCEL_LSB;
  imu["ay"] = ay / ACCEL_LSB;
  imu["az"] = az / ACCEL_LSB;
  imu["gx"] = gx / GYRO_LSB;
  imu["gy"] = gy / GYRO_LSB;
  imu["gz"] = gz / GYRO_LSB;

  // Static buffer (not Arduino String) — avoids heap fragmentation that kills
  // the WebSocket client when streaming continuously.
  static char buf[384];
  size_t n = serializeJson(doc, buf, sizeof(buf));
  webSocket.sendTXT(buf, n);
}

// ==========================================
void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED:
      wsConnected = true;
      Serial.println("[WS] Connected to GaitGuard backend");
      break;
    case WStype_DISCONNECTED:
      wsConnected = false;
      Serial.println("[WS] Disconnected");
      break;
    case WStype_ERROR:
      Serial.println("[WS] Error");
      break;
    default:
      break;
  }
}

// ==========================================
// Local /data JSON (unchanged — lets you still poll the ESP32 directly)
void handleData() {
  readSensors();
  StaticJsonDocument<512> doc;
  doc["timestamp"] = millis();
  doc["heel"] = heel; doc["met1"] = met1; doc["met5"] = met5; doc["toe"] = toe;
  doc["ax"] = ax; doc["ay"] = ay; doc["az"] = az;
  doc["gx"] = gx; doc["gy"] = gy; doc["gz"] = gz;
  String json; serializeJson(doc, json);
  server.send(200, "application/json", json);
}

void handleRoot() {
  String page = R"rawliteral(
<!DOCTYPE html><html><head><title>GaitGuard Insole</title>
<style>body{font-family:Arial;background:#f4f4f4;padding:30px}h1{color:#1e88e5}
td{padding:6px 18px;border-bottom:1px solid #ccc}.ok{color:#0a0}.bad{color:#b00}</style></head>
<body><h1>GaitGuard Insole</h1>
<p>Streaming to backend: <b id="ws"></b></p>
<table>
<tr><td>Heel</td><td id="heel"></td></tr><tr><td>Met1</td><td id="met1"></td></tr>
<tr><td>Met5</td><td id="met5"></td></tr><tr><td>Toe</td><td id="toe"></td></tr>
<tr><td>AX</td><td id="ax"></td></tr><tr><td>AY</td><td id="ay"></td></tr><tr><td>AZ</td><td id="az"></td></tr>
<tr><td>GX</td><td id="gx"></td></tr><tr><td>GY</td><td id="gy"></td></tr><tr><td>GZ</td><td id="gz"></td></tr>
</table>
<script>
async function u(){let d=await (await fetch('/data')).json();
for(const k of ['heel','met1','met5','toe','ax','ay','az','gx','gy','gz'])
document.getElementById(k).innerHTML=d[k];}
setInterval(u,150);</script></body></html>
)rawliteral";
  server.send(200, "text/html", page);
}

// ==========================================
void setup() {
  Serial.begin(115200);
  pinMode(ledPin, OUTPUT);
  pinMode(buzzerPin, OUTPUT);
  digitalWrite(ledPin, LOW);
  digitalWrite(buzzerPin, LOW);

  Wire.begin(21, 22);
  mpu.initialize();

  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\nWiFi Connected");
  Serial.print("ESP32 IP: "); Serial.println(WiFi.localIP());
  Serial.println(mpu.testConnection() ? "MPU6050 Connected" : "MPU6050 FAILED");

  // Local HTTP server (kept)
  server.on("/", handleRoot);
  server.on("/data", handleData);
  server.begin();
  Serial.println("HTTP server started");

  // WebSocket client → GaitGuard ingest
  String path = String("/ws/ingest/insole?session=") + SESSION_ID + "&token=" + INGEST_TOKEN;
  webSocket.begin(BACKEND_HOST, BACKEND_PORT, path.c_str());
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(3000);
  // Keep the link alive + detect dead connections cleanly (ping 15s, 3s timeout).
  webSocket.enableHeartbeat(15000, 3000, 2);
  Serial.print("Streaming to ws://");
  Serial.print(BACKEND_HOST); Serial.print(":"); Serial.print(BACKEND_PORT);
  Serial.println(path);
}

// ==========================================
void loop() {
  server.handleClient();
  webSocket.loop();

  unsigned long now = millis();
  if (wsConnected && now - lastSend >= SEND_INTERVAL_MS) {
    lastSend = now;
    sendInsoleFrame();
  }
}
