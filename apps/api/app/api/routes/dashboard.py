"""Dashboard summary — aggregate KPIs for the landing page."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import Alert, Device, Patient, Session

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
async def summary(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    total_patients = await db.scalar(select(func.count()).select_from(Patient)) or 0
    active_sessions = await db.scalar(
        select(func.count()).select_from(Session).where(Session.status == "active")
    ) or 0
    high_risk = await db.scalar(
        select(func.count()).select_from(Session).where(Session.peak_level == "high")
    ) or 0
    open_alerts = await db.scalar(
        select(func.count()).select_from(Alert).where(Alert.status == "open")
    ) or 0
    devices_online = await db.scalar(
        select(func.count()).select_from(Device).where(Device.status == "online")
    ) or 0
    devices_total = await db.scalar(select(func.count()).select_from(Device)) or 0

    # Risk distribution across patients (by baseline as a proxy).
    dist_rows = (await db.execute(
        select(Patient.baseline_risk, func.count()).group_by(Patient.baseline_risk)
    )).all()
    distribution = {level: count for level, count in dist_rows}

    return {
        "total_patients": total_patients,
        "active_patients": active_sessions,
        "high_risk_patients": high_risk,
        "open_alerts": open_alerts,
        "devices": {"online": devices_online, "total": devices_total},
        "distribution": {
            "normal": distribution.get("normal", 0),
            "mild": distribution.get("mild", 0),
            "high": distribution.get("high", 0),
        },
    }
