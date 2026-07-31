"""Patient directory."""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models import Patient
from app.schemas import PatientCreate, PatientOut

router = APIRouter(prefix="/api/patients", tags=["patients"])


@router.get("", response_model=List[PatientOut])
async def list_patients(
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    stmt = select(Patient).order_by(Patient.name)
    if search:
        like = f"%{search}%"
        stmt = stmt.where(or_(Patient.name.ilike(like), Patient.mrn.ilike(like)))
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.post("", response_model=PatientOut, status_code=201)
async def create_patient(
    body: PatientCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("admin", "clinician")),
):
    patient = Patient(**body.model_dump())
    db.add(patient)
    await db.commit()
    await db.refresh(patient)
    return patient


@router.get("/{patient_id}", response_model=PatientOut)
async def get_patient(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    patient = await db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient
