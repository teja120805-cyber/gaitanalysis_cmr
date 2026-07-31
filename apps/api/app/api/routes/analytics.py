"""Analytics — longitudinal metric series over a selectable range."""

from __future__ import annotations

import math
from typing import List

from fastapi import APIRouter, Depends, Query

from app.core.deps import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

_POINTS = {"day": 24, "week": 7, "month": 30, "year": 12}
_METRICS = {
    "stride_variability": (4.0, 2.0, 0.05),
    "cadence": (104.0, 8.0, -0.2),
    "pressure_symmetry": (88.0, 6.0, -0.1),
    "center_of_pressure": (12.0, 4.0, 0.08),
    "trunk_sway": (4.0, 3.0, 0.06),
    "tremor": (20.0, 12.0, 0.2),
    "step_count": (620.0, 180.0, 4.0),
}


def _series(n: int, base: float, amp: float, drift: float) -> List[float]:
    return [round(base + math.sin(i / 2) * amp + i * drift, 2) for i in range(n)]


@router.get("/overview")
async def overview(
    range: str = Query("week", pattern="^(day|week|month|year)$"),
    _=Depends(get_current_user),
):
    n = _POINTS[range]
    return {
        "range": range,
        "points": n,
        "metrics": {
            name: _series(n, base, amp, drift)
            for name, (base, amp, drift) in _METRICS.items()
        },
    }
