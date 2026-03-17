from __future__ import annotations

import hashlib
from typing import Optional

import httpx
from fastapi import Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.disposable_email_domains import DISPOSABLE_EMAIL_DOMAINS
from app.models.database import User


def extract_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for", "").strip()
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def hash_abuse_signal(value: str | None) -> str | None:
    if not value:
        return None
    normalized = value.strip()
    if not normalized:
        return None
    return hashlib.sha256(f"{settings.JWT_SECRET_KEY}:{normalized}".encode("utf-8")).hexdigest()


def is_disposable_email(email: str) -> bool:
    domain = email.rsplit("@", 1)[-1].strip().lower()
    return domain in DISPOSABLE_EMAIL_DOMAINS


async def verify_turnstile_token(token: str, remote_ip: str | None = None) -> bool:
    if not settings.TURNSTILE_SECRET_KEY:
        return True

    response_payload = {"secret": settings.TURNSTILE_SECRET_KEY, "response": token}
    if remote_ip:
        response_payload["remoteip"] = remote_ip

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(settings.TURNSTILE_SITEVERIFY_URL, data=response_payload)
        response.raise_for_status()
        payload = response.json()
        return bool(payload.get("success"))


def determine_trial_block_reason(
    db: Session,
    *,
    signup_ip_hash: str | None,
    device_fingerprint_hash: str | None,
) -> str | None:
    if not device_fingerprint_hash:
        return "missing_fingerprint"

    existing_device_trial = (
        db.query(User.id)
        .filter(
            User.device_fingerprint_hash == device_fingerprint_hash,
            User.trial_granted_at.is_not(None),
        )
        .first()
    )
    if existing_device_trial:
        return "device_limit"

    if signup_ip_hash:
        ip_trial_count = (
            db.query(User.id)
            .filter(
                User.signup_ip_hash == signup_ip_hash,
                User.trial_granted_at.is_not(None),
            )
            .count()
        )
        if ip_trial_count >= max(settings.TRIAL_MAX_ACCOUNTS_PER_IP, 1):
            return "ip_limit"

    return None
