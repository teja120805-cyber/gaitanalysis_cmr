"""GaitGuard API entrypoint.

Run:  uvicorn app.main:app --reload   (from apps/api)
Docs: http://localhost:8000/docs
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    alerts,
    analytics,
    auth,
    dashboard,
    devices,
    notifications,
    patients,
    reports,
    sessions,
    settings as settings_routes,
    trends,
)
from app.core.config import settings
from app.core.database import init_db
from app.services.seed import seed
from app.ws.hub import hub
from app.ws.routes import router as ws_router
from app.ws.session_runtime import sessions as session_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    if settings.seed_on_startup:
        await seed()
    await hub.start()
    yield
    await session_manager.stop_all()
    await hub.stop()


app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST
app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(sessions.router)
app.include_router(alerts.router)
app.include_router(trends.router)
app.include_router(dashboard.router)
app.include_router(analytics.router)
app.include_router(reports.router)
app.include_router(devices.router)
app.include_router(notifications.router)
app.include_router(settings_routes.router)
# WebSocket
app.include_router(ws_router)


@app.get("/api/health", tags=["meta"])
async def health():
    return {
        "status": "ok",
        "db": "postgres" if settings.is_postgres else "sqlite",
        "realtime": "redis" if settings.redis_url else "in-process",
    }
