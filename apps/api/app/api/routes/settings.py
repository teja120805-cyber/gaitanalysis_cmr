"""Settings — key/value store for org + system configuration."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models import Setting

router = APIRouter(prefix="/api/settings", tags=["settings"])


class SettingIn(BaseModel):
    key: str
    value: Any


@router.get("")
async def get_settings(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    rows = (await db.execute(select(Setting))).scalars().all()
    return {r.key: r.value for r in rows}


@router.put("")
async def put_setting(
    body: SettingIn,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("admin", "clinician")),
):
    existing = await db.get(Setting, body.key)
    if existing:
        existing.value = body.value
        existing.updated_at = datetime.utcnow()
    else:
        db.add(Setting(key=body.key, value=body.value))
    await db.commit()
    return {"ok": True, "key": body.key}
