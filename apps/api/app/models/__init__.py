"""SQLAlchemy models. Relational core + time-series tables (Timescale on Postgres)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    JSON,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def _uuid() -> str:
    return uuid.uuid4().hex


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(120))
    # Admin | Clinician | Caregiver | Patient
    role: Mapped[str] = mapped_column(String(20), default="clinician")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    mrn: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    age: Mapped[int] = mapped_column(Integer)
    sex: Mapped[str] = mapped_column(String(1))
    room: Mapped[str] = mapped_column(String(60))
    condition: Mapped[str] = mapped_column(Text)
    baseline_risk: Mapped[str] = mapped_column(String(10), default="normal")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    sessions: Mapped[list["Session"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), index=True)
    clinician_id: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(12), default="active")  # active|ended
    peak_level: Mapped[str] = mapped_column(String(10), default="normal")

    patient: Mapped["Patient"] = relationship(back_populates="sessions")


class RiskScore(Base):
    """2 Hz fused assessments. Hypertable on Postgres/Timescale."""

    __tablename__ = "risk_scores"

    session_id: Mapped[str] = mapped_column(String(32), primary_key=True, index=True)
    time: Mapped[datetime] = mapped_column(DateTime, primary_key=True)
    score: Mapped[float] = mapped_column(Float)
    level: Mapped[str] = mapped_column(String(10))
    confidence: Mapped[float] = mapped_column(Float)
    drivers: Mapped[dict] = mapped_column(JSON, default=dict)


class SensorSample(Base):
    """Raw insole samples. Hypertable on Postgres; off by default in the demo."""

    __tablename__ = "sensor_samples"

    session_id: Mapped[str] = mapped_column(String(32), primary_key=True)
    time: Mapped[datetime] = mapped_column(DateTime, primary_key=True)
    fsr: Mapped[dict] = mapped_column(JSON, default=dict)
    imu: Mapped[dict] = mapped_column(JSON, default=dict)


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    session_id: Mapped[str] = mapped_column(String(32), index=True)
    url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    generated_by: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(120))
    specialty: Mapped[str] = mapped_column(String(80), default="Neurology")
    email: Mapped[str] = mapped_column(String(255), unique=True)
    org_id: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    serial: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    type: Mapped[str] = mapped_column(String(20))  # insole | camera
    patient_id: Mapped[Optional[str]] = mapped_column(String(32), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(12), default="online")  # online|offline
    battery: Mapped[int] = mapped_column(Integer, default=100)
    last_seen: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    user_id: Mapped[Optional[str]] = mapped_column(String(32), nullable=True, index=True)
    channel: Mapped[str] = mapped_column(String(12), default="in_app")  # in_app|email|sms
    title: Mapped[str] = mapped_column(String(160))
    body: Mapped[str] = mapped_column(Text, default="")
    read: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class RiskPrediction(Base):
    """Forward-looking risk forecast (distinct from the realtime risk_scores)."""

    __tablename__ = "risk_predictions"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    patient_id: Mapped[str] = mapped_column(String(32), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    horizon_hours: Mapped[int] = mapped_column(Integer, default=24)
    predicted_score: Mapped[float] = mapped_column(Float)
    predicted_level: Mapped[str] = mapped_column(String(10))
    model_version: Mapped[str] = mapped_column(String(20), default="rule-v1")


class Setting(Base):
    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    value: Mapped[dict] = mapped_column(JSON, default=dict)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    patient_id: Mapped[str] = mapped_column(String(32), index=True)
    session_id: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    # fall | high_risk | abnormal_pressure | sensor_failure | low_battery
    type: Mapped[str] = mapped_column(String(24), default="high_risk")
    # critical | high | medium | low
    priority: Mapped[str] = mapped_column(String(10), default="high")
    level: Mapped[str] = mapped_column(String(10))
    title: Mapped[str] = mapped_column(String(160))
    detail: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(14), default="open")  # open|acknowledged|resolved
    ack_by: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
