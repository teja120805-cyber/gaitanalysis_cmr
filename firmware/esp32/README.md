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
