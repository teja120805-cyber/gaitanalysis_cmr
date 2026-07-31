"""Devices — insole + camera hardware inventory and health."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import Device

router = APIRouter(prefix="/api/devices", tags=["devices"])


class DeviceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    serial: str
    type: str
    patient_id: Optional[str]
    status: str
    battery: int
    last_seen: datetime


@router.get("", response_model=List[DeviceOut])
async def list_devices(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    res = await db.execute(select(Device).order_by(Device.type, Device.serial))
    return list(res.scalars().all())
