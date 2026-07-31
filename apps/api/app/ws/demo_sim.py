"""In-process demo simulator.

Stands in for the ESP32 insole + MediaPipe vision worker so the dashboard can run
a fully live session from the browser with one API call — no external script, no
hardware. It feeds a session's FusionState and publishes insole/pose frames to the
hub; the session's own 2 Hz fusion loop produces the risk + alerts.

The generated frames match apps/web/src/lib/types (InsoleFrame / PoseFrame), and
the gait model mirrors the frontend mock: a severity scenario that drifts
Normal → Mild → High → recovery, with freezing-of-gait episodes.
"""

from __future__ import annotations

import asyncio
import math
import random
import time
from typing import Callable, List, Optional

from app.ws.hub import hub
from gaitguard_fusion import InsoleSample, PoseSample

TAU = math.pi * 2
INSOLE_DT = 0.02   # 50 Hz
POSE_DT = 0.033    # ~30 Hz
GRACE_S = 6.0      # startup grace before subscriber checks
IDLE_STOP_S = 10.0 # stop after this long with no dashboard watching


def _clamp01(v: float) -> float:
    return 0.0 if v < 0 else 1.0 if v > 1 else v


def _bump(x: float, c: float, w: float) -> float:
    d = (x - c) / w
    return math.exp(-0.5 * d * d)


def _rollover(stance: Optional[float]) -> List[float]:
    if stance is None:
        return [0.02, 0.02, 0.02, 0.02]
    return [
        _bump(stance, 0.12, 0.14),
        _bump(stance, 0.45, 0.2) * 0.85,
        _bump(stance, 0.58, 0.22) * 0.9,
        _bump(stance, 0.86, 0.16),
    ]


def _phase_to_stance(p: float, offset: float, frac: float = 0.62) -> Optional[float]:
    local = (p - offset + 1) % 1
    return None if local > frac else local / frac


def _severity(elapsed: float) -> float:
    t = elapsed % 120
    if t < 20:
        return 0.15
    if t < 45:
        return 0.15 + (t - 20) / 25 * 0.35
    if t < 70:
        return 0.5 + (t - 45) / 25 * 0.4
    if t < 95:
        return 0.9 - (t - 70) / 25 * 0.55
    return max(0.15, 0.35 - (t - 95) / 25 * 0.2)


def _skeleton(phase: float, sev: float) -> List[List[float]]:
    """33 normalized MediaPipe-style landmarks; fills the joints the 3D view draws."""
    swing = math.sin(phase * TAU)
    arm_amp = 0.12 * (1 - sev * 0.6)
    sway = sev * 0.03 * math.sin((time.time()) % 1 * TAU)
    cx = 0.5 + sway
    leg = swing * 0.05
    arm = swing * arm_amp
    stoop = sev * 0.03
    jitter = (lambda: (random.random() - 0.5) * sev * 0.02) if sev > 0.55 else (lambda: 0.0)

    pts = [[cx, 0.5, 0.0] for _ in range(33)]

    def s(i, x, y, z=0.0):
        pts[i] = [x, y, z]

    s(0, cx, 0.12 + stoop, -stoop)
    s(2, cx - 0.03, 0.11 + stoop)
    s(5, cx + 0.03, 0.11 + stoop)
    s(11, cx - 0.1, 0.26 + stoop, arm)
    s(12, cx + 0.1, 0.26 + stoop, -arm)
    s(13, cx - 0.13, 0.4, arm * 1.6)
    s(14, cx + 0.13, 0.4, -arm * 1.6)
    s(15, cx - 0.14, 0.53, arm * 2 + jitter())
    s(16, cx + 0.14, 0.53, -arm * 2 + jitter())
    s(23, cx - 0.07, 0.55)
    s(24, cx + 0.07, 0.55)
    s(25, cx - 0.08, 0.72, leg)
    s(26, cx + 0.08, 0.72, -leg)
    s(27, cx - 0.08, 0.9, leg * 1.4)
    s(28, cx + 0.08, 0.9, -leg * 1.4)
    return pts


class DemoSim:
    def __init__(self, session_id: str, rt) -> None:
        self.session_id = session_id
        self.rt = rt
        self.running = False
        self._task: Optional[asyncio.Task] = None
        self._on_done: Optional[Callable[[], None]] = None
        self._phase = 0.0
        self._freeze_until = 0.0
        self._idle_since: Optional[float] = None

    def start(self, on_done: Optional[Callable[[], None]] = None) -> None:
        if self.running:
            return
        self._on_done = on_done
        self.running = True
        self._task = asyncio.create_task(self._run())
        self._task.add_done_callback(self._done_cb)

    def _done_cb(self, _task) -> None:
        self.running = False
        if self._on_done:
            self._on_done()

    async def stop(self) -> None:
        self.running = False
        if self._task:
            self._task.cancel()

    async def _run(self) -> None:
        start = time.time()
        last_insole = last_pose = 0.0
        try:
            while self.running:
                now = time.time()
                sev = _severity(now - start)

                if now - last_insole >= INSOLE_DT:
                    last_insole = now
                    self._emit_insole(now, sev)

                if now - last_pose >= POSE_DT:
                    last_pose = now
                    await self._emit_pose(now, sev)

                # Auto-stop when nobody is watching (browser closed w/o cleanup).
                if now - start > GRACE_S and not hub.has_subscribers(self.session_id):
                    self._idle_since = self._idle_since or now
                    if now - self._idle_since > IDLE_STOP_S:
                        self.running = False
                        return
                else:
                    self._idle_since = None

                await asyncio.sleep(0.005)
        except asyncio.CancelledError:
            pass

    def _emit_insole(self, now: float, sev: float) -> None:
        if now > self._freeze_until and sev > 0.7 and random.random() < 0.02:
            self._freeze_until = now + random.uniform(0.8, 1.8)
        frozen = now < self._freeze_until
        scale = 0.15 if frozen else 1.0
        cadence = 4 if frozen else 108 - sev * 34 + random.uniform(-sev * 10, sev * 10)
        self._phase = (self._phase + (cadence / 60 / 2) * INSOLE_DT) % 1

        ls = _phase_to_stance(self._phase, 0.0)
        rs = _phase_to_stance(self._phase, 0.5)
        asym = 1 - sev * 0.4
        left = [_clamp01(v * scale + random.uniform(-0.03, 0.03)) for v in _rollover(ls)]
        right = [_clamp01(v * asym * scale + random.uniform(-0.03, 0.03)) for v in _rollover(rs)]
        impact = 0.6 if (ls is not None and ls < 0.15) else 0.0
        swaymag = sev * 0.35

        frame = {
            "t": now * 1000.0,
            "fsr": {"left": left, "right": right},
            "imu": {
                "ax": random.uniform(-1, 1) * (0.05 + swaymag),
                "ay": random.uniform(-1, 1) * (0.05 + swaymag),
                "az": 1 + impact + random.uniform(-0.08, 0.08),
                "gx": random.uniform(-1, 1) * (8 + sev * 40),
                "gy": random.uniform(-1, 1) * (8 + sev * 40),
                "gz": random.uniform(-1, 1) * (6 + sev * 55),
            },
        }
        imu = frame["imu"]
        self.rt.add_insole(
            InsoleSample(
                t=frame["t"], fsr_left=left, fsr_right=right,
                ax=imu["ax"], ay=imu["ay"], az=imu["az"],
                gx=imu["gx"], gy=imu["gy"], gz=imu["gz"],
            )
        )
        # publish raw frame for the dashboard (fire-and-forget)
        asyncio.create_task(hub.publish(self.session_id, {"type": "insole", "payload": frame}))

    async def _emit_pose(self, now: float, sev: float) -> None:
        metrics = {
            "cadence": 108 - sev * 34,
            "stepLengthSym": _clamp01(1 - sev * 0.5 + random.uniform(-0.03, 0.03)),
            "armSwingSym": _clamp01(1 - sev * 0.55 + random.uniform(-0.03, 0.03)),
            "trunkSway": 1.5 + sev * 7 + random.uniform(-0.4, 0.4),
            "doubleSupport": 18 + sev * 14 + random.uniform(-1, 1),
        }
        frame = {"t": now * 1000.0, "landmarks": _skeleton(self._phase, sev), "metrics": metrics}
        self.rt.add_pose(
            PoseSample(
                t=frame["t"], cadence=metrics["cadence"],
                step_length_sym=metrics["stepLengthSym"],
                arm_swing_sym=metrics["armSwingSym"],
                trunk_sway=metrics["trunkSway"],
                double_support=metrics["doubleSupport"],
            )
        )
        await hub.publish(self.session_id, {"type": "pose", "payload": frame})
