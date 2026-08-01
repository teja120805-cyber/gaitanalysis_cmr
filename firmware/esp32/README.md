# GaitGuard — ESP32 Firmware

`gaitguard_esp32.ino` turns your smart insole into a **direct GaitGuard device**:
it keeps the original local HTTP monitor page **and** pushes normalized insole
frames straight to the backend over a WebSocket (`/ws/ingest/insole`) — no Python
bridge required.

```
ESP32 (FSR×4 + MPU6050) ──WebSocket──▶ /ws/ingest/insole ──▶ fusion ──▶ dashboard
```

## Wiring (unchanged from your sketch)

| Signal | GPIO |
|--------|------|
| FSR heel | 32 |
| FSR met1 (1st metatarsal · medial) | 33 |
| FSR met5 (5th metatarsal · lateral) | 34 |
| FSR toe | 35 |
| MPU6050 SDA / SCL | 21 / 22 |
| LED / Buzzer | 26 / 25 |

## Libraries (Arduino Library Manager)

| Library | Author |
|---------|--------|
| **WebSockets** (arduinoWebSockets) | Markus Sattler |
| **ArduinoJson** | Benoit Blanchon |
| **MPU6050** (I2Cdevlib / Electronic Cats) | same as your original sketch |

Board: **ESP32 Dev Module** (esp32 core by Espressif).

## Configure

Edit the top of `gaitguard_esp32.ino`:

```cpp
const char* ssid     = "kkkk";
const char* password = "123456879";
const char* BACKEND_HOST = "192.168.1.100";  // PC running the GaitGuard backend
const uint16_t BACKEND_PORT = 8000;
const char* SESSION_ID   = "pt-1042";        // any id; open it in the dashboard
const char* INGEST_TOKEN = "gaitguard-device-token";
#define FOOT 0   // 0 = both (mirror single insole), 1 = left, 2 = right
```

> Find `BACKEND_HOST` on the PC running the API (e.g. `ipconfig` → IPv4). The ESP32
> and that PC must be on the **same WiFi/hotspot**.

## Make the backend reachable (important)

By default the API binds to `127.0.0.1`, which the ESP32 **cannot** reach. Start it
bound to all interfaces, and open the port on the firewall:

```bash
cd apps/api
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

```powershell
# Windows — allow inbound port 8000 (once)
netsh advfirewall firewall add rule name="GaitGuard 8000" dir=in action=allow protocol=TCP localport=8000
```

Sanity check from any device on the network — open `http://<backend-ip>:8000/api/health`;
you should get `{"status":"ok",...}`. If that fails, the ESP32 won't connect either.

## Run

1. Start the backend (`apps/api`) and frontend (`apps/web`) on the PC.
2. Flash the sketch. Open the Serial Monitor (115200) — it prints the ESP32 IP and
   `[WS] Connected to GaitGuard backend`.
3. Open the dashboard:
   **`http://<backend-ip>:3000/monitor/pt-1042?session=pt-1042`**

   The cockpit joins that session and shows your **real insole** live — pressure
   heatmap, foot-pressure distribution, center of pressure, sensor values, and the
   fused fall-risk score.

## Add the camera on the same session

```bash
cd apps/vision
python worker.py --session pt-1042 --display
```

Both streams now fuse into one explainable risk score.

## Notes

- **Timestamps:** the ESP32 sends `millis()`; the backend **stamps its own receive
  time** on ingest, so no NTP/clock sync is needed.
- **Normalization on-device:** FSR ÷4095 → 0..1; accel ÷16384 → g; gyro ÷131 → °/s
  (defaults for ±2 g / ±250 °/s). Adjust the `*_LSB` constants if you change the
  MPU6050 full-scale ranges.
- **Single insole:** `FOOT 0` mirrors the one foot to both sides so left/right
  asymmetry isn't falsely maxed. Use two boards (`FOOT 1` / `FOOT 2`) for true
  bilateral load.
- The local page (`http://<esp32-ip>/`) and `/data` endpoint still work if you want
  to poll the device directly.

## Troubleshooting

| Symptom | Fix |
|---|---|
| WiFi OK but no `[WS] Connected` | `BACKEND_HOST` wrong, backend not started with `--host 0.0.0.0`, or firewall blocking the port |
| `[WS] Disconnected` looping | `INGEST_TOKEN` must match the backend's `INGEST_TOKEN` (default `gaitguard-device-token`) |
| Dashboard shows "awaiting sensor data" | The `?session=` in the URL must equal `SESSION_ID` in the sketch |
| Can't reach backend from ESP32 | ESP32 and PC on different networks (e.g. PC on Ethernet, ESP32 on hotspot) |
| MPU6050 FAILED on boot | Check SDA/SCL wiring (GPIO 21/22) and the sensor's I²C address |

> Tip: the dashboard's **"Connect a device"** card (shown on a live session with no
> data yet) prints the exact URL + config values for the current session.
