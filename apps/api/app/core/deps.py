"""Request dependencies: authenticated user resolution + role gating."""

from __future__ import annotations

from typing import List

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_token
from app.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

_UNAUTH = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not authenticated",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = decode_token(token, expected_type="access")
    if not payload:
        raise _UNAUTH
    user = await db.get(User, payload.get("sub"))
    if not user:
        raise _UNAUTH
    return user


def require_role(*roles: str):
    """Dependency factory: allow only users whose role is in `roles`."""
    allowed = {r.lower() for r in roles}

    async def _guard(user: User = Depends(get_current_user)) -> User:
        if user.role.lower() not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires role: {', '.join(sorted(allowed))}",
            )
        return user

    return _guard
