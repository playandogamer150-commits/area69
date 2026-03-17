from __future__ import annotations

from urllib.parse import urlparse
from urllib.parse import unquote

from fastapi import HTTPException, status

from app.core.config import settings
from app.models.database import User


def _r2_base_url() -> str:
    if settings.R2_PUBLIC_BASE_URL:
        return settings.R2_PUBLIC_BASE_URL.rstrip("/")
    return f"https://pub-{settings.R2_ACCOUNT_ID}.r2.dev"


def _build_r2_user_prefix(current_user: User) -> str:
    return f"{_r2_base_url()}/users/{current_user.id}/"


def validate_user_storage_path(path: str, current_user: User, *, allowed_prefixes: tuple[str, ...] | None = None) -> str:
    normalized = unquote(path.strip())
    if ".." in normalized:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid storage path")

    parsed = urlparse(normalized)
    if parsed.scheme in {"http", "https"}:
        expected_prefix = _build_r2_user_prefix(current_user)
        if not normalized.startswith(expected_prefix):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Resource does not belong to the current user",
            )
        if allowed_prefixes:
            allowed_public_prefixes = tuple(
                prefix.replace(f"/storage/{current_user.id}/", expected_prefix)
                for prefix in allowed_prefixes
            )
            if not any(normalized.startswith(prefix) for prefix in allowed_public_prefixes):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Storage path is not allowed for this operation")
        return normalized

    expected_prefix = f"/storage/{current_user.id}/"
    if not normalized.startswith(expected_prefix):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Resource does not belong to the current user",
        )
    if allowed_prefixes and not any(normalized.startswith(prefix) for prefix in allowed_prefixes):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Storage path is not allowed for this operation")
    return normalized


def build_public_storage_url(path: str) -> str:
    parsed = urlparse(path)
    if parsed.scheme in {"http", "https"}:
        return path
    return f"{settings.BACKEND_PUBLIC_URL.rstrip('/')}{path}"
