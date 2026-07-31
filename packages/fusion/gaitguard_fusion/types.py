"""Shared data types for the fusion engine. Plain dataclasses — no third-party deps."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Literal

RiskLevel = Literal["normal", "mild", "high"]


@dataclass
class InsoleSample:
    """One insole frame: 4 FSR per foot (normalized 0..1) + 6-axis IMU."""

    t: float  # epoch ms
    fsr_left: List[float]  # [heel, lateral, medial, toe]
    fsr_right: List[float]
    ax: float
    ay: float
    az: float
    gx: float
    gy: float
    gz: float


@dataclass
class PoseSample:
    """One vision frame: MediaPipe landmarks + derived gait metrics."""

    t: float
    cadence: float
    step_length_sym: float
    arm_swing_sym: float
    trunk_sway: float
    double_support: float


@dataclass
class RiskDriver:
    key: str
    label: str
    weight: float  # contribution to the score, 0..1
    source: Literal["insole", "vision", "fusion"]


@dataclass
class RiskAssessment:
    t: float
    level: RiskLevel
    score: float
    confidence: float
    drivers: List[RiskDriver] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "t": self.t,
            "level": self.level,
            "score": round(self.score, 4),
            "confidence": round(self.confidence, 4),
            "drivers": [
                {
                    "key": d.key,
                    "label": d.label,
                    "weight": round(d.weight, 4),
                    "source": d.source,
                }
                for d in self.drivers
            ],
        }
