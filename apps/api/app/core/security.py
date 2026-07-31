"""Password hashing + JWT access/refresh tokens."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from .config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _create_token(sub: str, role: str, kind: str, expires: timedelta) -> str:
    now = datetime.utcnow()
    payload = {
        "sub": sub,
        "role": role,
        "type": kind,
        "iat": now,
        "exp": now + expires,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(sub: str, role: str) -> str:
    return _create_token(
        sub, role, "access", timedelta(minutes=settings.access_token_minutes)
    )


def create_refresh_token(sub: str, role: str) -> str:
    return _create_token(
        sub, role, "refresh", timedelta(days=settings.refresh_token_days)
    )


def decode_token(token: str, expected_type: Optional[str] = None) -> Optional[dict]:
    try:
        payload = jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
    except JWTError:
        return None
    if expected_type and payload.get("type") != expected_type:
        return None
    return payload
