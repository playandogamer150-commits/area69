from __future__ import annotations

from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field, field_validator
import logging

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.anti_abuse import (
    determine_trial_block_reason,
    extract_client_ip,
    hash_abuse_signal,
    is_disposable_email,
    verify_turnstile_token,
)
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, get_current_user, get_password_hash, verify_password
from app.models.database import LicenseKey, User, get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)


class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    name: Optional[str] = Field(default=None, max_length=255)
    deviceFingerprint: Optional[str] = Field(default=None, max_length=512)
    turnstileToken: Optional[str] = Field(default=None, max_length=2048)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or normalized.startswith("@") or normalized.endswith("@"):
            raise ValueError("Invalid email address")
        return normalized

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if value.strip() != value:
            raise ValueError("Password must not start or end with spaces")
        return value

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @field_validator("deviceFingerprint")
    @classmethod
    def normalize_device_fingerprint(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @field_validator("turnstileToken")
    @classmethod
    def normalize_turnstile_token(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or normalized.startswith("@") or normalized.endswith("@"):
            raise ValueError("Invalid email address")
        return normalized

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not value:
            raise ValueError("Password is required")
        return value


class ActivateLicenseRequest(BaseModel):
    licenseKey: str = Field(..., min_length=5, max_length=128)

    @field_validator("licenseKey")
    @classmethod
    def normalize_license_key(cls, value: str) -> str:
        normalized = value.strip().upper()
        if not normalized:
            raise ValueError("License key is required")
        return normalized


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = Field(default=None, max_length=255)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "isActive": user.is_active,
        "licenseStatus": user.license_status or "inactive",
        "licensePlan": user.license_plan,
        "licenseKey": user.license_key,
        "licenseActivatedAt": user.license_activated_at.isoformat() if user.license_activated_at else None,
        "licenseExpiresAt": user.license_expires_at.isoformat() if user.license_expires_at else None,
        "trialEditCreditsRemaining": max(user.trial_edit_credits_remaining or 0, 0),
        "trialBlockedReason": user.trial_blocked_reason,
        "createdAt": user.created_at.isoformat() if user.created_at else None,
    }


def _find_seed_file() -> Path | None:
    app_file = Path(__file__).resolve()
    candidates = [
        app_file.parents[3] / "area69-license-seed.txt",
        app_file.parents[4] / "area69-license-seed.txt",
    ]
    return next((path for path in candidates if path.exists()), None)


def _ensure_seeded_license(db: Session, normalized_key: str) -> LicenseKey | None:
    existing = db.query(LicenseKey).filter(LicenseKey.key == normalized_key).first()
    if existing:
        return existing

    seed_file = _find_seed_file()
    if seed_file is None:
        return None

    keys = {line.strip().upper() for line in seed_file.read_text(encoding="utf-8").splitlines() if line.strip()}
    if normalized_key not in keys:
        return None

    seeded = LicenseKey(
        key=normalized_key,
        plan_name="lifetime",
        is_active=True,
        max_activations=1,
        activations_count=0,
    )
    db.add(seeded)
    db.commit()
    db.refresh(seeded)
    return seeded


@router.post("/register", response_model=TokenResponse)
async def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    if is_disposable_email(payload.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Disposable email addresses are not allowed")

    client_ip = extract_client_ip(request)
    if settings.TURNSTILE_SECRET_KEY:
        if not payload.turnstileToken:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Turnstile token is required")
        if not await verify_turnstile_token(payload.turnstileToken, client_ip):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Turnstile verification failed")

    signup_ip_hash = hash_abuse_signal(client_ip)
    device_fingerprint_hash = hash_abuse_signal(payload.deviceFingerprint)
    trial_blocked_reason = determine_trial_block_reason(
        db,
        signup_ip_hash=signup_ip_hash,
        device_fingerprint_hash=device_fingerprint_hash,
    )
    trial_credits = settings.TRIAL_INITIAL_EDIT_CREDITS if trial_blocked_reason is None else 0
    trial_granted_at = datetime.utcnow() if trial_credits > 0 else None

    user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        name=payload.name,
        is_active=True,
        license_status="inactive",
        trial_edit_credits_remaining=trial_credits,
        trial_blocked_reason=trial_blocked_reason,
        trial_granted_at=trial_granted_at,
        signup_ip_hash=signup_ip_hash,
        last_ip_hash=signup_ip_hash,
        device_fingerprint_hash=device_fingerprint_hash,
    )
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Failed to create user")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao criar usuario no banco de dados",
        ) from exc

    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": serialize_user(user),
    }


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    user.last_ip_hash = hash_abuse_signal(extract_client_ip(request))
    db.commit()

    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": serialize_user(user),
    }


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return serialize_user(current_user)


@router.patch("/me")
async def update_me(payload: UpdateProfileRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.name is not None:
        current_user.name = payload.name
    db.commit()
    db.refresh(current_user)
    return serialize_user(current_user)


@router.post("/activate-license")
async def activate_license(
    payload: ActivateLicenseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    normalized_key = payload.licenseKey
    license_key = _ensure_seeded_license(db, normalized_key)
    if not license_key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="License key not found")
    if (
        current_user.license_key == license_key.key
        and (current_user.license_status or "inactive") == "active"
        and license_key.assigned_user_id == current_user.id
    ):
        return {
            "ok": True,
            "message": "License already active for this account",
            "user": serialize_user(current_user),
        }
    if not license_key.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="License key is inactive")
    if license_key.assigned_user_id and license_key.assigned_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="License key already activated by another account")
    if license_key.activations_count >= license_key.max_activations:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="License key reached maximum activations")

    now = datetime.utcnow()
    license_key.assigned_user_id = current_user.id
    license_key.activations_count = max(license_key.activations_count, 0) + 1
    license_key.activated_at = now

    current_user.license_key = license_key.key
    current_user.license_status = "active"
    current_user.license_plan = license_key.plan_name
    current_user.license_activated_at = now
    current_user.license_expires_at = license_key.expires_at

    db.commit()
    db.refresh(current_user)
    return {
        "ok": True,
        "message": "License activated successfully",
        "user": serialize_user(current_user),
    }


@router.post("/logout")
async def logout():
    return {"message": "Successfully logged out"}
