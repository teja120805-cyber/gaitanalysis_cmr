"""Alert triage queue."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import Alert, Patient
from app.schemas import AlertUpdate

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


class AlertRow(BaseModel):
    id: str
    type: str
    priority: str
    level: str
    patient_id: str
    patient_name: Optional[str]
    title: str
    detail: str
    status: str
    created_at: datetime


def _row(a: Alert, name: Optional[str]) -> AlertRow:
    return AlertRow(
        id=a.id, type=a.type, priority=a.priority, level=a.level,
        patient_id=a.patient_id, patient_name=name, title=a.title,
        detail=a.detail, status=a.status, created_at=a.created_at,
    )


@router.get("", response_model=List[AlertRow])
async def list_alerts(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    stmt = (
        select(Alert, Patient.name)
        .join(Patient, Patient.id == Alert.patient_id, isouter=True)
        .order_by(Alert.created_at.desc())
        .limit(100)
    )
    if status_filter:
        stmt = stmt.where(Alert.status == status_filter)
    res = await db.execute(stmt)
    return [_row(a, name) for a, name in res.all()]


@router.patch("/{alert_id}", response_model=AlertRow)
async def update_alert(
    alert_id: str,
    body: AlertUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = body.status
    if body.status == "acknowledged":
        alert.ack_by = user.id
    await db.commit()
    await db.refresh(alert)
    name = await db.scalar(select(Patient.name).where(Patient.id == alert.patient_id))
    return _row(alert, name)
