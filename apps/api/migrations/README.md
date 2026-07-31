# Migrations (Alembic)

The demo auto-creates tables on startup (SQLAlchemy `create_all`). For production
use Alembic against PostgreSQL/Timescale.

```bash
cd apps/api
pip install alembic
# point at Postgres
export DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/gaitguard

# generate the first migration from the models
alembic revision --autogenerate -m "initial schema"
# apply
alembic upgrade head
```

`migrations/env.py` is async-aware and reads `DATABASE_URL` from app settings,
targeting `app.models` metadata. Timescale hypertables + the continuous aggregate
are created by `infra/schema.sql` (run once after `alembic upgrade head`), since
`create_hypertable` isn't expressible as a plain SQLAlchemy table.
