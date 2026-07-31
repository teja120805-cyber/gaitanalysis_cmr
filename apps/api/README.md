# GaitGuard API

FastAPI backend: auth (JWT + RBAC), REST (patients / sessions / alerts / trends),
and the realtime layer — WebSocket ingest for the ESP32 + vision worker, a
per-session **fusion loop** (the shared `gaitguard_fusion` rule engine), and a
broadcast hub to dashboards.

**Zero-infra defaults:** SQLite + in-process pub/sub. Flip to Postgres/Timescale
+ Redis with two env vars — no code changes.

## Run

```bash
cd apps/api
python -m venv .venv
.venv\Scripts\activate            # Windows  (source .venv/bin/activate on *nix)
pip install -r requirements.txt
cp .env.example .env              # optional; defaults work as-is
uvicorn app.main:app --reload     # → http://localhost:8000/docs
```

On startup it creates tables and seeds demo users + patients.

### Demo logins

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@gaitguard.health` | `admin123` |
| Clinician | `clinician@gaitguard.health` | `clinician123` |
| Caregiver | `caregiver@gaitguard.health` | `caregiver123` |

## See the whole pipeline live

With the server running, in a second terminal:

```bash
cd apps/api
.venv\Scripts\activate
python scripts/simulate.py --patient pt-1042 --duration 120
```

This logs in, starts a session, and streams synthetic insole (50 Hz) + vision
(30 Hz) frames to the ingest sockets. The server fuses them into risk at 2 Hz and
broadcasts to `ws://localhost:8000/ws/live/{session_id}`. Watch it with any WS
client (or wire the dashboard to it — payloads already match `web/src/lib/types`).

## Key endpoints

```
POST /api/auth/login            (OAuth2 form: username=email, password)
POST /api/auth/refresh          GET /api/auth/me
GET/POST /api/patients          GET /api/patients/{id}
POST /api/patients/{id}/sessions   PATCH /api/sessions/{id}   (stop)
GET  /api/sessions/{id}/timeseries GET /api/patients/{id}/trends
GET/PATCH /api/alerts
GET  /api/health

WS   /ws/ingest/insole?session=&token=      (device → server)
WS   /ws/ingest/vision?session=&token=
WS   /ws/live/{session_id}?token=           (server → dashboard)
```

## Production switches

```bash
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/gaitguard   # + Timescale
REDIS_URL=redis://localhost:6379/0                                # multi-worker fan-out
```

With Postgres, `init_db()` promotes `risk_scores` and `sensor_samples` to Timescale
hypertables (best-effort). With Redis, the hub routes through pub/sub so any worker
serves any client. Use Alembic for real migrations (tables are auto-created here for
demo convenience).
