"""Async SQLAlchemy setup. SQLite by default; Postgres/Timescale via DATABASE_URL."""

from __future__ import annotations

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from .config import settings

engine = create_async_engine(settings.database_url, echo=False, future=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session


async def init_db() -> None:
    """Create tables. On Postgres, promote the high-volume tables to Timescale
    hypertables + a continuous aggregate (best-effort; no-op if unavailable)."""
    from app import models  # noqa: F401  (register mappers)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    if settings.is_postgres:
        from sqlalchemy import text

        stmts = [
            "CREATE EXTENSION IF NOT EXISTS timescaledb",
            "SELECT create_hypertable('risk_scores', 'time', if_not_exists => TRUE, migrate_data => TRUE)",
            "SELECT create_hypertable('sensor_samples', 'time', if_not_exists => TRUE, migrate_data => TRUE)",
        ]
        async with engine.begin() as conn:
            for s in stmts:
                try:
                    await conn.execute(text(s))
                except Exception:
                    # Timescale not installed or already configured — safe to skip.
                    pass
