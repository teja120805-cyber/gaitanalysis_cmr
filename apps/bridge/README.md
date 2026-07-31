# GaitGuard — ESP32 Insole Bridge

Streams your **ESP32 smart-insole** into GaitGuard without changing the firmware.

Your ESP32 runs an HTTP server that serves live JSON at `GET http://<esp32-ip>/data`.
This bridge polls that endpoint, normalizes the readings, maps them to GaitGuard's
insole contract, and pushes them to the backend's WebSocket ingest — driving the
plantar-pressure heatmap, foot-pressure distribution, center of pressure, live
sensor values, and the fused fall-risk score.

```
ESP32 (/data HTTP)  →  bridge (poll + normalize)  →  /ws/ingest/insole  →  fusion  →  dashboard
```

## Data mapping

| ESP32 field | Raw range | → GaitGuard |
|-------------|-----------|-------------|
| `heel`, `met1`, `met5`, `toe` | 0–4095 (12-bit ADC) | `fsr[…]` normalized `÷4095` → 0..1 |
| FSR order | heel · met1 (medial) · met5 (lateral) · toe | reordered to `[heel, lateral, medial, toe]` |
| `ax,ay,az` | int16 (±2 g) | `÷16384` → g |
| `gx,gy,gz` | int16 (±250 °/s) | `÷131` → °/s |

> **Single insole?** Your firmware has 4 FSR = one foot. By default (`--foot both`)
> the bridge mirrors it to both feet so left/right asymmetry isn't falsely maxed.
> Use `--foot left` or `--foot right` if you have a dedicated per-foot device.

## Setup

```bash
cd apps/bridge
python -m venv .venv && .venv\Scripts\activate   # (source .venv/bin/activate on *nix)
pip install -r requirements.txt
```

## Run

Find the ESP32's IP from its serial monitor (`ESP32 IP Address: …`), then:

```bash
python esp32_bridge.py --esp32 192.168.1.50 --patient pt-1042
```

It logs in, creates a session, and prints:

```
👉 Watch it: http://localhost:3000/monitor/pt-1042?session=<session-id>
   (add vision on the same session: python worker.py --session <session-id>)
```

Open that URL — the cockpit joins the session and shows your **real insole** live.

## Full fusion: insole + vision on one session

```bash
# terminal 1 — insole
python esp32_bridge.py --esp32 192.168.1.50 --patient pt-1042
#   → prints session id S

# terminal 2 — vision (same session)
cd ../vision && python worker.py --session S --display
```

Now the fusion engine combines both streams — plantar load, IMU sway, cadence,
arm swing, trunk sway — into one explainable risk score.

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--esp32` | *(required)* | ESP32 IP or URL (`192.168.1.50` or `http://…`) |
| `--host` | `localhost:8000` | GaitGuard backend |
| `--patient` | `pt-1042` | Patient to open a session for |
| `--session` | – | Feed an existing session id (shared with vision) |
| `--token` | `gaitguard-device-token` | Device ingest token (`INGEST_TOKEN`) |
| `--foot` | `both` | Which foot the insole maps to |
| `--rate` | `50` | Target poll/send rate (Hz) |

## Requirements
- The machine running the bridge and the ESP32 must be on the **same network**.
- The ESP32 sketch already in your repo works as-is — no reflash needed.

> Prefer a firmware push instead of polling? A future `firmware/esp32/` sketch can
> connect directly to `/ws/ingest/insole` (WebSocketsClient) and drop the bridge —
> but polling keeps your current working firmware untouched.
