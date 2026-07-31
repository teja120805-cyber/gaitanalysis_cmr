"""GaitGuard fusion engine.

A pure, dependency-free package that turns aligned insole + vision samples into a
fall-risk assessment (Normal / Mild / High) with explainable drivers. Imported by
the API and (later) the vision worker; unit-testable on recorded CSVs.
"""

from .types import (
    InsoleSample,
    PoseSample,
    RiskAssessment,
    RiskDriver,
    RiskLevel,
)
from .engine import FusionState, RiskEngine, level_from_score

__all__ = [
    "InsoleSample",
    "PoseSample",
    "RiskAssessment",
    "RiskDriver",
    "RiskLevel",
    "FusionState",
    "RiskEngine",
    "level_from_score",
]
