"""Pydantic v2 request/response models."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# --- Auth -------------------------------------------------------------------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: str
    full_name: str
    role: str


# --- Patients ---------------------------------------------------------------
class PatientBase(BaseModel):
    mrn: str
    name: str
    age: int
    sex: str = Field(pattern="^[MF]$")
    room: str
    condition: str
    baseline_risk: str = "normal"


class PatientCreate(PatientBase):
    pass


class PatientOut(PatientBase):
    model_config = ConfigDict(from_attributes=True)
    id: str


# --- Sessions ---------------------------------------------------------------
class SessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    patient_id: str
    clinician_id: Optional[str]
    started_at: datetime
    ended_at: Optional[datetime]
    status: str
    peak_level: str


# --- Alerts -----------------------------------------------------------------
class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    patient_id: str
    session_id: Optional[str]
    level: str
    title: str
    detail: str
    status: str
    created_at: datetime


class AlertUpdate(BaseModel):
    status: str = Field(pattern="^(open|acknowledged|resolved)$")


# --- Trends -----------------------------------------------------------------
class TrendPoint(BaseModel):
    t: datetime
    score: float
    level: str


class RiskSample(BaseModel):
    t: datetime
    score: float
    level: str
    confidence: float
    drivers: List[dict] = []
