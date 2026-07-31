"""Monitoring sessions: start / stop / list / detail."""

from __future__ import annotations

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import Patient, Session
from app.schemas import SessionOut
from app.ws.session_runtime import sessions as session_manager

router = APIRouter(prefix="/api", tags=["sessions"])


@router.post("/patients/{patient_id}/sessions", response_model=SessionOut, status_code=201)
async def start_session(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    patient = await db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    session = Session(patient_id=patient_id, clinician_id=user.id, status="active")
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get("/patients/{patient_id}/sessions", response_model=List[SessionOut])
async def list_sessions(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    res = await db.execute(
        select(Session)
        .where(Session.patient_id == patient_id)
        .order_by(Session.started_at.desc())
    )
    return list(res.scalars().all())


@router.get("/sessions/{session_id}", response_model=SessionOut)
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.patch("/sessions/{session_id}", response_model=SessionOut)
async def stop_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.status = "ended"
    session.ended_at = datetime.utcnow()
    await db.commit()
    await db.refresh(session)
    return session


@router.post("/sessions/{session_id}/simulate", status_code=202)
async def start_simulation(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Start an in-process demo simulator for this session (ESP32 + vision
    stand-in) so the dashboard runs on live fusion with no external hardware."""
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session_manager.start_sim(session_id)
    return {"status": "simulating", "session_id": session_id}


@router.delete("/sessions/{session_id}/simulate", status_code=200)
async def stop_simulation(
    session_id: str,
    _=Depends(get_current_user),
):
    await session_manager.stop_sim(session_id)
    return {"status": "stopped", "session_id": session_id}
