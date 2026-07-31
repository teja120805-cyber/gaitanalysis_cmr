"""Idempotent demo seed: users + patients matching the dashboard's roster."""

from __future__ import annotations

from sqlalchemy import func, select

from datetime import datetime, timedelta

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import Alert, Device, Doctor, Notification, Patient, User

DEMO_USERS = [
    ("admin@gaitguard.health", "admin123", "System Administrator", "admin"),
    ("clinician@gaitguard.health", "clinician123", "Dr. R. Okonkwo", "clinician"),
    ("caregiver@gaitguard.health", "caregiver123", "J. Rivera", "caregiver"),
]

# Ids mirror apps/web/src/lib/patients.ts so a live wire-up lines up 1:1.
DEMO_PATIENTS = [
    ("pt-1042", "MRN-1042", "Eleanor Whitfield", 74, "F", "Neuro-3B · 312",
     "Parkinson's (H&Y II) · post-fall monitoring", "mild"),
    ("pt-2071", "MRN-2071", "Marcus Bell", 68, "M", "Neuro-3B · 318",
     "Gait instability · balance assessment", "normal"),
    ("pt-3390", "MRN-3390", "Priya Nadar", 81, "F", "Rehab-2 · 204",
     "Recurrent falls · vestibular workup", "high"),
    ("pt-4415", "MRN-4415", "Daniel Okafor", 71, "M", "Neuro-3B · 305",
     "Early Parkinsonism · freezing episodes", "mild"),
]


async def seed() -> None:
    async with SessionLocal() as db:
        count = await db.scalar(select(func.count()).select_from(User))
        if count and count > 0:
            return  # already seeded

        for email, pw, name, role in DEMO_USERS:
            db.add(
                User(
                    email=email.lower(),
                    hashed_password=hash_password(pw),
                    full_name=name,
                    role=role,
                )
            )

        for pid, mrn, name, age, sex, room, cond, base in DEMO_PATIENTS:
            db.add(
                Patient(
                    id=pid, mrn=mrn, name=name, age=age, sex=sex,
                    room=room, condition=cond, baseline_risk=base,
                )
            )

        for name, spec, email in [
            ("Dr. R. Okonkwo", "Neurology", "okonkwo@gaitguard.health"),
            ("Dr. A. Lindqvist", "Rehabilitation", "lindqvist@gaitguard.health"),
            ("Dr. M. Haddad", "Geriatrics", "haddad@gaitguard.health"),
        ]:
            db.add(Doctor(name=name, specialty=spec, email=email))

        devices = [
            ("ESP32-A1", "insole", "pt-3390", "online", 84),
            ("ESP32-A2", "insole", "pt-3390", "online", 81),
            ("CAM-R2", "camera", "pt-3390", "online", 100),
            ("ESP32-B7", "insole", "pt-2071", "offline", 12),
            ("ESP32-C3", "insole", "pt-1042", "online", 67),
            ("CAM-N3", "camera", "pt-1042", "online", 100),
        ]
        for serial, typ, pid, status, batt in devices:
            db.add(Device(serial=serial, type=typ, patient_id=pid, status=status, battery=batt))

        for title, body, ch in [
            ("High fall-risk · Priya Nadar", "Freezing episode detected in Rehab-2 · 204", "in_app"),
            ("Gait deviation · Eleanor Whitfield", "Reduced arm swing trending up", "in_app"),
            ("Session completed", "Marcus Bell · 32-min walk assessment", "in_app"),
        ]:
            db.add(Notification(title=title, body=body, channel=ch))

        now = datetime.utcnow()
        demo_alerts = [
            ("pt-3390", "fall", "critical", "high", "Fall-pattern detected · Priya Nadar",
             "Sudden load loss + high sway · freezing episode", "open", 1),
            ("pt-3390", "high_risk", "critical", "high", "High fall-risk · Priya Nadar",
             "Score 71% · primary driver: freezing / festination", "open", 2),
            ("pt-1042", "abnormal_pressure", "high", "mild", "Abnormal pressure · Eleanor Whitfield",
             "Load asymmetry 68/32 · lateral instability", "open", 11),
            ("pt-2071", "low_battery", "medium", "mild", "Low battery · Marcus Bell",
             "Left insole battery at 12%", "acknowledged", 20),
            ("pt-4415", "sensor_failure", "high", "mild", "Sensor failure · Daniel Okafor",
             "Vision camera Rehab-2 dropped offline", "acknowledged", 38),
            ("pt-3390", "abnormal_pressure", "medium", "mild", "Abnormal pressure · Priya Nadar",
             "Trunk sway above threshold during turn", "resolved", 120),
        ]
        for pid, typ, prio, lvl, title, detail, status, mins in demo_alerts:
            db.add(Alert(
                patient_id=pid, type=typ, priority=prio, level=lvl,
                title=title, detail=detail, status=status,
                created_at=now - timedelta(minutes=mins),
            ))

        await db.commit()
