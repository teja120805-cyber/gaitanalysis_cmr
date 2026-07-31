"""Trends & session time-series (reads risk_scores)."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import RiskScore, Session
from app.schemas import RiskSample, TrendPoint

router = APIRouter(prefix="/api", tags=["trends"])


@router.get("/sessions/{session_id}/timeseries", response_model=List[RiskSample])
async def session_timeseries(
    session_id: str,
    limit: int = Query(600, le=5000),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(
        select(RiskScore)
        .where(RiskScore.session_id == session_id)
        .order_by(RiskScore.time.desc())
        .limit(limit)
    )
    rows = list(res.scalars().all())
    rows.reverse()
    return [
        RiskSample(
            t=r.time, score=r.score, level=r.level,
            confidence=r.confidence, drivers=r.drivers or [],
        )
        for r in rows
    ]


@router.get("/patients/{patient_id}/trends", response_model=List[TrendPoint])
async def patient_trends(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Risk points across all of a patient's sessions (demo aggregation).

    On Postgres/Timescale this would read a continuous aggregate; on SQLite we
    just return the raw risk points joined by session.
    """
    res = await db.execute(
        select(RiskScore)
        .join(Session, Session.id == RiskScore.session_id)
        .where(Session.patient_id == patient_id)
        .order_by(RiskScore.time)
        .limit(2000)
    )
    return [
        TrendPoint(t=r.time, score=r.score, level=r.level)
        for r in res.scalars().all()
    ]
