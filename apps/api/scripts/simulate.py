"""Stream simulator — stands in for the ESP32 insole + MediaPipe vision worker.

Logs in, starts a monitoring session for a patient, then streams synthetic insole
(50 Hz) and vision (30 Hz) frames to the ingest WebSockets. The server's fusion
loop turns them into live risk on the dashboard channel — proving the full
pipeline end-to-end with no hardware.

Usage:
    python scripts/simulate.py --patient pt-1042 --duration 120
"""

from __future__ import annotations

import argparse
import asyncio
import json
import math
import random
import time

import httpx
import websockets

API = "http://localhost:8000"
WS = "ws://localhost:8000"
INGEST_TOKEN = "gaitguard-device-token"


def severity(elapsed: float) -> float:
    t = elapsed % 120
    if t < 20:
        return 0.15
    if t < 45:
        return 0.15 + (t - 20) / 25 * 0.35   # → mild
    if t < 70:
        return 0.5 + (t - 45) / 25 * 0.4     # → high
    if t < 95:
        return 0.9 - (t - 70) / 25 * 0.55    # recovery → mild
    return max(0.15, 0.35 - (t - 95) / 25 * 0.2)


def clamp01(v: float) -> float:
    return 0.0 if v < 0 else 1.0 if v > 1 else v


def bump(x, c, w):
    d = (x - c) / w
    return math.exp(-0.5 * d * d)


def rollover(stance):
    if stance is None:
        return [0.02, 0.02, 0.02, 0.02]
    return [
        bump(stance, 0.12, 0.14),
        bump(stance, 0.45, 0.2) * 0.85,
        bump(stance, 0.58, 0.22) * 0.9,
        bump(stance, 0.86, 0.16),
    ]


def phase_to_stance(p, offset, frac=0.62):
    local = (p - offset + 1) % 1
    return None if local > frac else local / frac


async def stream_insole(uri, start, stop_evt):
    phase = 0.0
    freeze_until = 0.0
    async with websockets.connect(uri, max_size=None) as ws:
        while not stop_evt.is_set():
            now = time.time()
            sev = severity(now - start)
            # Freezing-of-gait episodes at high severity: plantar load collapses.
            if now > freeze_until and sev > 0.7 and random.random() < 0.02:
                freeze_until = now + random.uniform(0.8, 1.8)
            frozen = now < freeze_until
            load_scale = 0.15 if frozen else 1.0
            cadence = 4 if frozen else 108 - sev * 34 + random.uniform(-sev * 10, sev * 10)
            phase = (phase + (cadence / 60 / 2) * 0.02) % 1
            ls = phase_to_stance(phase, 0.0)
            rs = phase_to_stance(phase, 0.5)
            asym = 1 - sev * 0.4
            left = [clamp01(v * load_scale + random.uniform(-0.03, 0.03)) for v in rollover(ls)]
            right = [clamp01(v * asym * load_scale + random.uniform(-0.03, 0.03)) for v in rollover(rs)]
            frame = {
                "t": now * 1000.0,
                "fsr": {"left": left, "right": right},
                "imu": {
                    "ax": random.uniform(-1, 1) * (0.05 + sev * 0.35),
                    "ay": random.uniform(-1, 1) * (0.05 + sev * 0.35),
                    "az": 1 + random.uniform(-0.08, 0.08),
                    "gx": random.uniform(-1, 1) * (8 + sev * 40),
                    "gy": random.uniform(-1, 1) * (8 + sev * 40),
                    "gz": random.uniform(-1, 1) * (6 + sev * 55),
                },
            }
            await ws.send(json.dumps(frame))
            await asyncio.sleep(0.02)  # 50 Hz


async def stream_vision(uri, start, stop_evt):
    async with websockets.connect(uri, max_size=None) as ws:
        while not stop_evt.is_set():
            now = time.time()
            sev = severity(now - start)
            frame = {
                "t": now * 1000.0,
                "landmarks": [],  # server derives risk from metrics; landmarks optional
                "metrics": {
                    "cadence": 108 - sev * 34,
                    "stepLengthSym": clamp01(1 - sev * 0.5 + random.uniform(-0.03, 0.03)),
                    "armSwingSym": clamp01(1 - sev * 0.55 + random.uniform(-0.03, 0.03)),
                    "trunkSway": 1.5 + sev * 7 + random.uniform(-0.4, 0.4),
                    "doubleSupport": 18 + sev * 14 + random.uniform(-1, 1),
                },
            }
            await ws.send(json.dumps(frame))
            await asyncio.sleep(0.033)  # ~30 Hz


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--patient", default="pt-1042")
    ap.add_argument("--duration", type=float, default=120.0)
    ap.add_argument("--email", default="clinician@gaitguard.health")
    ap.add_argument("--password", default="clinician123")
    args = ap.parse_args()

    async with httpx.AsyncClient(base_url=API) as client:
        r = await client.post(
            "/api/auth/login",
            data={"username": args.email, "password": args.password},
        )
        r.raise_for_status()
        token = r.json()["access_token"]
        r = await client.post(
            f"/api/patients/{args.patient}/sessions",
            headers={"Authorization": f"Bearer {token}"},
        )
        r.raise_for_status()
        session = r.json()
        session_id = session["id"]
        print(f"Session {session_id} started for {args.patient}")
        print(f"→ Dashboard channel: {WS}/ws/live/{session_id}")

    insole_uri = f"{WS}/ws/ingest/insole?session={session_id}&token={INGEST_TOKEN}"
    vision_uri = f"{WS}/ws/ingest/vision?session={session_id}&token={INGEST_TOKEN}"

    start = time.time()
    stop_evt = asyncio.Event()

    async def timer():
        await asyncio.sleep(args.duration)
        stop_evt.set()

    print(f"Streaming {args.duration:.0f}s of gait (severity ramps Normal→High→recovery)…")
    await asyncio.gather(
        stream_insole(insole_uri, start, stop_evt),
        stream_vision(vision_uri, start, stop_evt),
        timer(),
    )
    print("Simulation complete.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nStopped.")
