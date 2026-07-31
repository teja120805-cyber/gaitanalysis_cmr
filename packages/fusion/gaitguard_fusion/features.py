"""Feature extraction over an aligned window of insole + vision samples.

Each feature is normalized to 0..1 where higher means *more abnormal*, so the
engine can combine them with fixed clinical weights.
"""

from __future__ import annotations

import math
from typing import List

from .types import InsoleSample, PoseSample


def clamp01(v: float) -> float:
    return 0.0 if v < 0 else 1.0 if v > 1 else v


def _mean(xs: List[float]) -> float:
    return sum(xs) / len(xs) if xs else 0.0


def load_asymmetry(insoles: List[InsoleSample]) -> float:
    """|L-R| plantar-load imbalance over the window, 0..1."""
    if not insoles:
        return 0.0
    left = _mean([sum(s.fsr_left) for s in insoles])
    right = _mean([sum(s.fsr_right) for s in insoles])
    denom = left + right
    if denom < 1e-6:
        return 0.0
    return clamp01(abs(left - right) / denom * 2.0)


def imu_sway(insoles: List[InsoleSample]) -> float:
    """Horizontal instability from the IMU (accel + yaw rate), 0..1."""
    if not insoles:
        return 0.0
    vals = [math.hypot(s.ax, s.ay) + abs(s.gz) / 90.0 for s in insoles]
    return clamp01(_mean(vals))


def freezing_index(insoles: List[InsoleSample], pose: List[PoseSample]) -> float:
    """Freezing / festination: stalled cadence or collapsed plantar load."""
    cadence = _mean([p.cadence for p in pose]) if pose else 60.0
    load = _mean([sum(s.fsr_left) + sum(s.fsr_right) for s in insoles]) if insoles else 1.0
    frozen = 0.0
    if cadence < 20:
        frozen = 1.0
    elif cadence < 45:
        frozen = 0.5
    if load < 0.25:
        frozen = max(frozen, 0.8)
    return clamp01(frozen)


def cadence_deficit(pose: List[PoseSample]) -> float:
    """Slowing below a healthy ~110 spm baseline, 0..1."""
    if not pose:
        return 0.0
    cadence = _mean([p.cadence for p in pose])
    return clamp01((110.0 - cadence) / 80.0)


def arm_swing_loss(pose: List[PoseSample]) -> float:
    if not pose:
        return 0.0
    return clamp01(1.0 - _mean([p.arm_swing_sym for p in pose]))


def trunk_sway_excess(pose: List[PoseSample]) -> float:
    if not pose:
        return 0.0
    return clamp01(_mean([p.trunk_sway for p in pose]) / 10.0)


def double_support_excess(pose: List[PoseSample]) -> float:
    if not pose:
        return 0.0
    return clamp01((_mean([p.double_support for p in pose]) - 18.0) / 18.0)


def extract(insoles: List[InsoleSample], pose: List[PoseSample]) -> dict:
    """The full normalized feature vector the engine scores."""
    return {
        "load_asym": load_asymmetry(insoles),
        "freeze": freezing_index(insoles, pose),
        "sway": max(imu_sway(insoles), trunk_sway_excess(pose)),
        "arm_swing": arm_swing_loss(pose),
        "cadence": cadence_deficit(pose),
        "double_support": double_support_excess(pose),
    }
