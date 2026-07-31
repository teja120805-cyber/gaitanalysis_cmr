"""The rule-based fusion engine and its per-session rolling state.

v1 is a transparent weighted rule engine: normalized features → weighted score →
level → ranked drivers. Because the weights are explicit, every score is
explainable — swap in a trained classifier later behind the same interface.
"""

from __future__ import annotations

import time
from collections import deque
from typing import Deque, Dict, Tuple

from . import features as F
from .types import InsoleSample, PoseSample, RiskAssessment, RiskDriver, RiskLevel

# Feature weight, human label, and originating stream. Ordered by weight.
WEIGHTS: Dict[str, Tuple[float, str, str]] = {
    "load_asym": (0.22, "Plantar load asymmetry", "insole"),
    "freeze": (0.20, "Freezing / festination", "fusion"),
    "sway": (0.18, "Trunk sway", "vision"),
    "arm_swing": (0.16, "Reduced arm swing", "vision"),
    "cadence": (0.14, "Cadence slowing", "insole"),
    "double_support": (0.10, "Double-support time", "fusion"),
}

NORMAL_MAX = 0.33
MILD_MAX = 0.66


def level_from_score(score: float) -> RiskLevel:
    if score < NORMAL_MAX:
        return "normal"
    if score < MILD_MAX:
        return "mild"
    return "high"


class RiskEngine:
    """Stateless scorer: features dict → RiskAssessment."""

    def assess(self, feats: Dict[str, float], t: float) -> RiskAssessment:
        score = 0.0
        drivers = []
        for key, (w, label, source) in WEIGHTS.items():
            contribution = feats.get(key, 0.0) * w
            score += contribution
            drivers.append(
                RiskDriver(key=key, label=label, weight=contribution, source=source)  # type: ignore[arg-type]
            )
        score = F.clamp01(score)
        drivers.sort(key=lambda d: d.weight, reverse=True)
        # Confidence peaks when the score is decisively low or high, dips mid-band.
        confidence = F.clamp01(0.78 + 0.18 * (1 - abs(score - 0.5) * 2))
        return RiskAssessment(
            t=t,
            level=level_from_score(score),
            score=score,
            confidence=confidence,
            drivers=drivers,
        )


class FusionState:
    """Rolling, time-aligned buffers for one monitoring session.

    Feed it raw insole/pose samples as they arrive; call `assess()` on a timer
    (e.g. 2 Hz) to get the current fused risk over the trailing window.
    """

    def __init__(self, window_ms: float = 2000.0, engine: RiskEngine = None):
        self.window_ms = window_ms
        self.engine = engine or RiskEngine()
        self.insoles: Deque[InsoleSample] = deque(maxlen=400)
        self.pose: Deque[PoseSample] = deque(maxlen=200)

    def _now_ms(self) -> float:
        return time.time() * 1000.0

    def _evict(self, now_ms: float) -> None:
        cutoff = now_ms - self.window_ms
        while self.insoles and self.insoles[0].t < cutoff:
            self.insoles.popleft()
        while self.pose and self.pose[0].t < cutoff:
            self.pose.popleft()

    def add_insole(self, s: InsoleSample) -> None:
        self.insoles.append(s)
        self._evict(s.t)

    def add_pose(self, s: PoseSample) -> None:
        self.pose.append(s)
        self._evict(s.t)

    def features(self, now_ms: float = None) -> Dict[str, float]:
        now_ms = self._now_ms() if now_ms is None else now_ms
        self._evict(now_ms)
        return F.extract(list(self.insoles), list(self.pose))

    def assess(self, now_ms: float = None) -> RiskAssessment:
        now_ms = self._now_ms() if now_ms is None else now_ms
        return self.engine.assess(self.features(now_ms), now_ms)
