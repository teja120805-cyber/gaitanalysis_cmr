"""Notifications — in-app / email / SMS (email + SMS are placeholders)."""

from __future__ import annotations

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import Notification

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    channel: str
    title: str
    body: str
    read: bool
    created_at: datetime


@router.get("", response_model=List[NotificationOut])
async def list_notifications(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    res = await db.execute(select(Notification).order_by(Notification.created_at.desc()).limit(50))
    return list(res.scalars().all())


@router.patch("/{notification_id}/read", response_model=NotificationOut)
async def mark_read(notification_id: str, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    n = await db.get(Notification, notification_id)
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.read = True
    await db.commit()
    await db.refresh(n)
    return n
