"""Reports — list, fetch, and generate session reports."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import Report, Session

router = APIRouter(prefix="/api/reports", tags=["reports"])


class ReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    session_id: str
    url: Optional[str]
    generated_by: Optional[str]
    created_at: datetime


@router.get("", response_model=List[ReportOut])
async def list_reports(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    res = await db.execute(select(Report).order_by(Report.created_at.desc()).limit(100))
    return list(res.scalars().all())


@router.get("/{report_id}", response_model=ReportOut)
async def get_report(report_id: str, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    report = await db.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.post("/sessions/{session_id}/generate", response_model=ReportOut, status_code=201)
async def generate_report(session_id: str, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    report = Report(
        session_id=session_id,
        url=f"/reports/rep-{session.patient_id}-{int(datetime.utcnow().timestamp())}",
        generated_by=user.id,
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report
