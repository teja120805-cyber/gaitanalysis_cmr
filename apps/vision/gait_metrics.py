"""
GaitAnalyzer — converts a live MediaPipe pose stream into GaitGuard's PoseFrame
metric contract:

    { cadence, stepLengthSym, armSwingSym, trunkSway, doubleSupport }

Cadence and step length come from vertical/horizontal ankle motion (heel‑strike
detection via rolling‑mean crossings). Arm‑swing symmetry compares left/right
wrist horizontal amplitude. Trunk sway is the variability of the shoulder→hip
lean angle. Double‑support is estimated from cadence (vision alone can't measure
ground contact directly). Outputs are EMA‑smoothed for stability.
"""

from __future__ import annotations

import math
from collections import deque
from typing import Deque, Dict, Optional, Tuple

from config import (
    CADENCE_BASELINE,
    HISTORY_SECONDS,
    LEFT_ANKLE,
    LEFT_HIP,
    LEFT_SHOULDER,
    LEFT_WRIST,
    RIGHT_ANKLE,
    RIGHT_HIP,
    RIGHT_SHOULDER,
    RIGHT_WRIST,
)


def _clamp(v: float, lo: float, hi: float) -> float:
    return lo if v < lo else hi if v > hi else v


class _Foot:
    """Per‑foot heel‑strike detector + step‑length tracker."""

    def __init__(self) -> None:
        self.ys: Deque[float] = deque(maxlen=40)
        self.prev_y: Optional[float] = None
        self.last_strike_x: Optional[float] = None
        self.step_lengths: Deque[float] = deque(maxlen=6)

    def update(self, x: float, y: float) -> bool:
        """Feed ankle (x, y); return True on a detected heel strike."""
        self.ys.append(y)
        struck = False
        if len(self.ys) >= 6:
            mean = sum(self.ys) / len(self.ys)
            # crossing upward through the mean = foot planting (y grows downward)
            if self.prev_y is not None and self.prev_y < mean <= y:
                struck = True
                if self.last_strike_x is not None:
                    self.step_lengths.append(abs(x - self.last_strike_x))
                self.last_strike_x = x
        self.prev_y = y
        return struck

    @property
    def mean_step_length(self) -> float:
        return sum(self.step_lengths) / len(self.step_lengths) if self.step_lengths else 0.0


class GaitAnalyzer:
    def __init__(self, window: float = HISTORY_SECONDS) -> None:
        self.window = window
        self.left = _Foot()
        self.right = _Foot()
        self.step_events: Deque[float] = deque()
        self.left_wrist_x: Deque[Tuple[float, float]] = deque()
        self.right_wrist_x: Deque[Tuple[float, float]] = deque()
        self.trunk_angles: Deque[Tuple[float, float]] = deque()
        self._t0: Optional[float] = None
        self._ema: Dict[str, float] = {}

    def _trim(self, dq: Deque[Tuple[float, float]], now: float) -> None:
        while dq and now - dq[0][0] > self.window:
            dq.popleft()

    def _ema_update(self, key: str, value: float, alpha: float = 0.25) -> float:
        prev = self._ema.get(key)
        out = value if prev is None else prev + alpha * (value - prev)
        self._ema[key] = out
        return out

    def feed(self, landmarks, t: float) -> Dict[str, float]:
        if self._t0 is None:
            self._t0 = t

        def p(i):
            lm = landmarks[i]
            return lm.x, lm.y

        lax, lay = p(LEFT_ANKLE)
        rax, ray = p(RIGHT_ANKLE)
        lwx, _ = p(LEFT_WRIST)
        rwx, _ = p(RIGHT_WRIST)
        lsx, lsy = p(LEFT_SHOULDER)
        rsx, rsy = p(RIGHT_SHOULDER)
        lhx, lhy = p(LEFT_HIP)
        rhx, rhy = p(RIGHT_HIP)

        # --- heel strikes → cadence ---
        if self.left.update(lax, lay):
            self.step_events.append(t)
        if self.right.update(rax, ray):
            self.step_events.append(t)
        self._trim_events(t)

        # --- arm swing ---
        self.left_wrist_x.append((t, lwx))
        self.right_wrist_x.append((t, rwx))
        self._trim(self.left_wrist_x, t)
        self._trim(self.right_wrist_x, t)

        # --- trunk lean angle (deg from vertical, medio‑lateral) ---
        sh_mid = ((lsx + rsx) / 2, (lsy + rsy) / 2)
        hip_mid = ((lhx + rhx) / 2, (lhy + rhy) / 2)
        dx = sh_mid[0] - hip_mid[0]
        dy = max(1e-4, hip_mid[1] - sh_mid[1])  # torso height (positive)
        trunk_angle = abs(math.degrees(math.atan2(dx, dy)))
        self.trunk_angles.append((t, trunk_angle))
        self._trim(self.trunk_angles, t)

        return self._metrics(t)

    def _trim_events(self, now: float) -> None:
        while self.step_events and now - self.step_events[0] > self.window:
            self.step_events.popleft()

    def _amp(self, dq: Deque[Tuple[float, float]]) -> float:
        if len(dq) < 3:
            return 0.0
        xs = [v for _, v in dq]
        return max(xs) - min(xs)

    def _metrics(self, t: float) -> Dict[str, float]:
        elapsed = max(0.5, min(self.window, t - (self._t0 or t)))
        cadence = len(self.step_events) / elapsed * 60.0
        cadence = _clamp(cadence, 0, 200)

        # step‑length symmetry (1 = symmetric)
        l, r = self.left.mean_step_length, self.right.mean_step_length
        step_sym = 1.0 - abs(l - r) / (l + r) if (l + r) > 1e-4 else 1.0

        # arm‑swing symmetry
        al, ar = self._amp(self.left_wrist_x), self._amp(self.right_wrist_x)
        if al + ar < 0.02:
            arm_sym = 1.0
        else:
            arm_sym = 1.0 - abs(al - ar) / (al + ar)

        # trunk sway (deg): variability of lean angle over the window
        if len(self.trunk_angles) >= 4:
            vals = [v for _, v in self.trunk_angles]
            mean = sum(vals) / len(vals)
            std = (sum((v - mean) ** 2 for v in vals) / len(vals)) ** 0.5
            trunk_sway = std * 2.5
        else:
            trunk_sway = 1.5

        # double‑support (%): estimated inversely from cadence
        double_support = _clamp(34.0 - (cadence - 40.0) * 0.14, 16.0, 40.0)

        return {
            "cadence": round(self._ema_update("cadence", cadence), 1),
            "stepLengthSym": round(_clamp(self._ema_update("stepLengthSym", step_sym), 0, 1), 3),
            "armSwingSym": round(_clamp(self._ema_update("armSwingSym", arm_sym), 0, 1), 3),
            "trunkSway": round(_clamp(self._ema_update("trunkSway", trunk_sway), 0, 14), 2),
            "doubleSupport": round(self._ema_update("doubleSupport", double_support), 1),
        }

    @staticmethod
    def idle_metrics() -> Dict[str, float]:
        """Metrics when no person is detected."""
        return {
            "cadence": 0.0,
            "stepLengthSym": 1.0,
            "armSwingSym": 1.0,
            "trunkSway": 1.5,
            "doubleSupport": 22.0,
        }
