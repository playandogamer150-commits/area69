from __future__ import annotations

from urllib.parse import unquote

from fastapi import HTTPException, status

from app.core.config import settings
from app.models.database import User


def validate_user_storage_path(path: str, current_user: User, *, allowed_prefixes: tuple[str, ...] | None = None) -> str:
    normalized = unquote(path.strip())
    expected_prefix = f"/storage/{current_user.id}/"
    if not normalized.startswith(expected_prefix):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Resource does not belong to the current user",
        )
    if ".." in normalized:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid storage path")
    if allowed_prefixes and not any(normalized.startswith(prefix) for prefix in allowed_prefixes):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Storage path is not allowed for this operation")
    return normalized


def build_public_storage_url(path: str) -> str:
    return f"{settings.BACKEND_PUBLIC_URL.rstrip('/')}{path}"
