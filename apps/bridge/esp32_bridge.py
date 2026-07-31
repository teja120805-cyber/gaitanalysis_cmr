"""
GaitGuard ESP32 Insole Bridge
=============================

Your ESP32 firmware runs an HTTP server that serves live sensor JSON at
`GET http://<esp32-ip>/data`:

    { "timestamp", "heel","met1","met5","toe",   # 4 FSR, raw 0..4095
      "ax","ay","az","gx","gy","gz" }            # MPU6050 raw int16

This bridge polls that endpoint, normalizes the values, maps them to GaitGuard's
insole frame contract, and streams them to the backend's WebSocket ingest
(`/ws/ingest/insole`) — so the real insole drives the pressure heatmap, center of
pressure, live sensor panels, and the fused fall-risk score.

Usage:
    python esp32_bridge.py --esp32 192.168.1.50 --patient pt-1042
    python esp32_bridge.py --esp32 192.168.1.50 --session <id>   # feed a shared session

Pair with the vision worker on the SAME session for full insole + vision fusion:
    (bridge)  python esp32_bridge.py --esp32 <ip> --patient pt-1042      # prints a session id
    (vision)  python worker.py --session <that-id> --display
"""

from __future__ import annotations

import argparse
import json
import sys
import time

import httpx
from websockets.sync.client import connect

# --- MPU6050 / ADC scaling (defaults for ±2 g, ±250 °/s, 12-bit ADC) ---
ADC_MAX = 4095.0
ACCEL_LSB = 16384.0   # raw → g
GYRO_LSB = 131.0      # raw → °/s


def _clamp01(v: float) -> float:
    return 0.0 if v < 0 else 1.0 if v > 1 else v


def _split_host(host: str):
    secure = host.startswith("https")
    host = host.replace("https://", "").replace("http://", "").rstrip("/")
    return (f"{'https' if secure else 'http'}://{host}", f"{'wss' if secure else 'ws'}://{host}")


def _esp_url(esp: str) -> str:
    esp = esp.rstrip("/")
    if not esp.startswith("http"):
        esp = "http://" + esp
    return esp + "/data"


def resolve_session(http_base: str, args) -> str:
    if args.session:
        return args.session
    with httpx.Client(base_url=http_base, timeout=10.0) as c:
        r = c.post("/api/auth/login", data={"username": args.email, "password": args.password})
        r.raise_for_status()
        token = r.json()["access_token"]
        r = c.post(f"/api/patients/{args.patient}/sessions", headers={"Authorization": f"Bearer {token}"})
        r.raise_for_status()
        return r.json()["id"]


def to_insole_frame(d: dict, foot: str) -> dict:
    """Map one ESP32 reading → GaitGuard insole frame.

    ESP32 FSR order: heel, met1 (1st metatarsal = medial), met5 (5th = lateral), toe.
    GaitGuard order: [heel, lateral, medial, toe].
    """
    fsr = [
        _clamp01(float(d.get("heel", 0)) / ADC_MAX),
        _clamp01(float(d.get("met5", 0)) / ADC_MAX),  # lateral
        _clamp01(float(d.get("met1", 0)) / ADC_MAX),  # medial
        _clamp01(float(d.get("toe", 0)) / ADC_MAX),
    ]
    zero = [0.0, 0.0, 0.0, 0.0]
    if foot == "left":
        left, right = fsr, zero
    elif foot == "right":
        left, right = zero, fsr
    else:  # "both" — a single insole; mirror so L/R asymmetry isn't falsely maxed
        left, right = fsr, list(fsr)

    return {
        "t": time.time() * 1000.0,
        "fsr": {"left": left, "right": right},
        "imu": {
            "ax": float(d.get("ax", 0)) / ACCEL_LSB,
            "ay": float(d.get("ay", 0)) / ACCEL_LSB,
            "az": float(d.get("az", 0)) / ACCEL_LSB,
            "gx": float(d.get("gx", 0)) / GYRO_LSB,
            "gy": float(d.get("gy", 0)) / GYRO_LSB,
            "gz": float(d.get("gz", 0)) / GYRO_LSB,
        },
    }


def main() -> None:
    ap = argparse.ArgumentParser(description="GaitGuard ESP32 insole bridge")
    ap.add_argument("--esp32", required=True, help="ESP32 IP or URL, e.g. 192.168.1.50")
    ap.add_argument("--host", default="localhost:8000", help="GaitGuard backend host")
    ap.add_argument("--patient", default="pt-1042")
    ap.add_argument("--session", default=None, help="Feed an existing session id")
    ap.add_argument("--token", default="gaitguard-device-token")
    ap.add_argument("--email", default="clinician@gaitguard.health")
    ap.add_argument("--password", default="clinician123")
    ap.add_argument("--foot", choices=["left", "right", "both"], default="both")
    ap.add_argument("--rate", type=float, default=50.0, help="Target poll/send rate (Hz)")
    args = ap.parse_args()

    http_base, ws_base = _split_host(args.host)
    esp_url = _esp_url(args.esp32)

    print(f"→ ESP32: {esp_url}")
    print("→ Resolving session…")
    session_id = resolve_session(http_base, args)
    ws_url = f"{ws_base}/ws/ingest/insole?session={session_id}&token={args.token}"
    print(f"✓ Session: {session_id}")
    print(f"✓ Ingest : {ws_url}")
    print(f"👉 Watch it: {http_base.replace('8000', '3000')}/monitor/{args.patient}?session={session_id}")
    print(f"   (add vision on the same session: python worker.py --session {session_id})")

    interval = 1.0 / max(1.0, args.rate)
    sent = 0
    errors = 0
    print("▶ Streaming insole… (Ctrl+C to stop)")
    try:
        with httpx.Client(timeout=2.0) as poll, connect(ws_url, max_size=None) as ws:
            next_t = time.time()
            while True:
                try:
                    r = poll.get(esp_url)
                    r.raise_for_status()
                    frame = to_insole_frame(r.json(), args.foot)
                    ws.send(json.dumps(frame))
                    sent += 1
                    errors = 0
                except Exception as e:
                    errors += 1
                    if errors <= 3 or errors % 50 == 0:
                        print(f"⚠ poll/send error ({errors}): {e}", file=sys.stderr)
                    if errors > 200:
                        print("✗ Too many consecutive errors — is the ESP32 reachable?", file=sys.stderr)
                        break
                # pace to target rate
                next_t += interval
                sleep = next_t - time.time()
                if sleep > 0:
                    time.sleep(sleep)
                else:
                    next_t = time.time()
    except KeyboardInterrupt:
        print("\n■ Stopped.")
    finally:
        print(f"Sent {sent} insole frames.")


if __name__ == "__main__":
    main()
