"""App configuration + a bootstrap that makes packages/fusion importable.

Running `uvicorn app.main:app` from apps/api, the shared fusion package lives at
../../packages/fusion. We add it to sys.path so the API can `import
gaitguard_fusion` without an editable install (keeps the hackathon setup to a
single `pip install -r requirements.txt`).
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict

# --- make the shared fusion package importable ------------------------------
# config.py is at apps/api/app/core/config.py → repo root is parents[4].
_REPO_ROOT = Path(__file__).resolve().parents[4]
_FUSION_PATH = _REPO_ROOT / "packages" / "fusion"
if _FUSION_PATH.exists() and str(_FUSION_PATH) not in sys.path:
    sys.path.insert(0, str(_FUSION_PATH))


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "GaitGuard API"
    database_url: str = "sqlite+aiosqlite:///./gaitguard.db"
    redis_url: str = ""

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 15
    refresh_token_days: int = 7

    ingest_token: str = "gaitguard-device-token"
    cors_origins: str = "http://localhost:3000"
    seed_on_startup: int = 1

    @property
    def cors_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_postgres(self) -> bool:
        return self.database_url.startswith("postgresql")


settings = Settings()
