"""Per-session fusion runtime.

Ingest handlers push raw insole/pose samples into a session's FusionState. A 2 Hz
background loop scores the trailing window with the shared rule engine, persists
the assessment, raises throttled alerts, and publishes everything to the hub. This
is the server-side equivalent of the dashboard's mock stream — same engine.
"""

from __future__ import annotations

import asyncio
import time
from datetime import datetime
from typing import Dict, Optional

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models import Alert, Notification, Patient, RiskScore, Session
from app.ws.hub import hub
from gaitguard_fusion import FusionState, InsoleSample, PoseSample

_LEVEL_RANK = {"normal": 0, "mild": 1, "high": 2}
RISK_PERIOD_S = 0.2   # 5 Hz fused assessment (snappier risk gauge/timeline)
ALERT_COOLDOWN_S = 6.0


class SessionRuntime:
    def __init__(self, session_id: str) -> None:
        self.session_id = session_id
        self.state = FusionState(window_ms=2000.0)
        self.ingest_refs = 0
        self._task: Optional[asyncio.Task] = None
        self._last_alert = 0.0
        self._peak = "normal"
        self.sim = None  # optional DemoSim

    def start(self) -> None:
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._loop())

    async def stop(self) -> None:
        if self._task:
            self._task.cancel()
            self._task = None

    # --- ingest -------------------------------------------------------------
    def add_insole(self, s: InsoleSample) -> None:
        self.state.add_insole(s)

    def add_pose(self, s: PoseSample) -> None:
        self.state.add_pose(s)

    # --- fusion loop --------------------------------------------------------
    async def _loop(self) -> None:
        try:
            while True:
                await asyncio.sleep(RISK_PERIOD_S)
                await self._tick()
        except asyncio.CancelledError:
            pass

    async def _tick(self) -> None:
        now_ms = time.time() * 1000.0
        # Only score once we have some data in the window.
        if not self.state.insoles and not self.state.pose:
            return
        assessment = self.state.assess(now_ms)
        payload = assessment.to_dict()

        await hub.publish(self.session_id, {"type": "risk", "payload": payload})

        # Persist the assessment, track peak level, and maybe raise an alert.
        async with SessionLocal() as db:
            sess = await db.get(Session, self.session_id)
            db.add(
                RiskScore(
                    session_id=self.session_id,
                    time=datetime.utcnow(),
                    score=assessment.score,
                    level=assessment.level,
                    confidence=assessment.confidence,
                    drivers=payload["drivers"],
                )
            )
            if sess and _LEVEL_RANK[assessment.level] > _LEVEL_RANK[sess.peak_level]:
                sess.peak_level = assessment.level
            await self._maybe_alert(db, assessment, sess)
            await db.commit()

    async def _maybe_alert(self, db, assessment, sess) -> None:
        now = time.time()
        if now - self._last_alert < ALERT_COOLDOWN_S or assessment.level != "high":
            return
        self._last_alert = now
        top_driver = assessment.drivers[0] if assessment.drivers else None
        top = top_driver.label.lower() if top_driver else "gait deviation"
        patient_id = sess.patient_id if sess else self.session_id
        patient_name = (await db.scalar(select(Patient.name).where(Patient.id == patient_id))) or "patient"

        # Freezing episodes escalate to a fall-type alert.
        is_freeze = top_driver is not None and top_driver.key == "freeze"
        alert_type = "fall" if is_freeze else "high_risk"
        title = "Fall-pattern detected" if is_freeze else "High fall-risk detected"

        alert = Alert(
            patient_id=patient_id,
            session_id=self.session_id,
            type=alert_type,
            priority="critical",
            level="high",
            title=f"{title} · {patient_name}",
            detail=f"Score {round(assessment.score * 100)}% · primary driver: {top}.",
            status="open",
        )
        db.add(alert)
        # Mirror to the notification feed (in-app).
        db.add(
            Notification(
                channel="in_app",
                title=alert.title,
                body=alert.detail,
            )
        )
        await db.flush()
        await hub.publish(
            self.session_id,
            {
                "type": "alert",
                "payload": {
                    "id": alert.id,
                    "t": time.time() * 1000.0,
                    "type": alert_type,
                    "priority": "critical",
                    "level": "high",
                    "title": alert.title,
                    "detail": alert.detail,
                    "status": "open",
                },
            },
        )


class SessionManager:
    def __init__(self) -> None:
        self._runtimes: Dict[str, SessionRuntime] = {}

    def get(self, session_id: str) -> SessionRuntime:
        rt = self._runtimes.get(session_id)
        if rt is None:
            rt = SessionRuntime(session_id)
            self._runtimes[session_id] = rt
        return rt

    async def on_ingest_connect(self, session_id: str) -> SessionRuntime:
        rt = self.get(session_id)
        rt.ingest_refs += 1
        rt.start()
        return rt

    async def on_ingest_disconnect(self, session_id: str) -> None:
        rt = self._runtimes.get(session_id)
        if not rt:
            return
        rt.ingest_refs = max(0, rt.ingest_refs - 1)
        if rt.ingest_refs == 0:
            await rt.stop()
            self._runtimes.pop(session_id, None)

    # --- demo simulator -----------------------------------------------------
    def start_sim(self, session_id: str) -> bool:
        """Start an in-process gait simulator feeding this session. Returns True
        if it (or an existing one) is running. Idempotent per session."""
        from app.ws.demo_sim import DemoSim

        rt = self.get(session_id)
        if rt.sim and rt.sim.running:
            return True
        rt.start()  # fusion loop
        sim = DemoSim(session_id, rt)
        rt.sim = sim
        sim.start(on_done=lambda: self._schedule_cleanup(session_id))
        return True

    def _schedule_cleanup(self, session_id: str) -> None:
        asyncio.create_task(self._cleanup_if_idle(session_id))

    async def _cleanup_if_idle(self, session_id: str) -> None:
        rt = self._runtimes.get(session_id)
        if not rt or (rt.sim and rt.sim.running):
            return
        await rt.stop()
        self._runtimes.pop(session_id, None)

    async def stop_sim(self, session_id: str) -> None:
        rt = self._runtimes.get(session_id)
        if not rt:
            return
        if rt.sim:
            await rt.sim.stop()
            rt.sim = None
        await rt.stop()
        self._runtimes.pop(session_id, None)

    async def stop_all(self) -> None:
        for rt in list(self._runtimes.values()):
            if rt.sim:
                await rt.sim.stop()
            await rt.stop()
        self._runtimes.clear()


sessions = SessionManager()
