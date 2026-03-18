from __future__ import annotations

from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
from urllib.parse import quote, urlparse

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field, field_validator
import logging
from jose import JWTError, jwt
import secrets

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
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_current_user,
    get_password_hash,
    user_trial_blocked_reason,
    user_trial_edit_credits_remaining,
    verify_password,
)
from app.models.database import LicenseKey, User, get_db
from app.services.oauth_service import OAuthIdentity, build_oauth_authorization_url, exchange_code_for_identity
from app.services.sms_verification_service import (
    SmsVerificationError,
    check_sms_verification_code,
    send_sms_verification_code,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)


class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    name: Optional[str] = Field(default=None, max_length=255)
    phoneNumber: str = Field(..., min_length=8, max_length=32)
    smsVerificationToken: str = Field(..., min_length=20, max_length=4096)
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

    @field_validator("phoneNumber")
    @classmethod
    def normalize_phone_number(cls, value: str) -> str:
        return _normalize_phone_number(value)

    @field_validator("smsVerificationToken")
    @classmethod
    def normalize_sms_verification_token(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("SMS verification token is required")
        return normalized

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


class OAuthStartRequest(BaseModel):
    deviceFingerprint: Optional[str] = Field(default=None, max_length=512)
    redirectTo: Optional[str] = Field(default=None, max_length=1024)

    @field_validator("deviceFingerprint")
    @classmethod
    def normalize_device_fingerprint(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @field_validator("redirectTo")
    @classmethod
    def normalize_redirect_to(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class SendSmsVerificationRequest(BaseModel):
    phoneNumber: str = Field(..., min_length=8, max_length=32)
    turnstileToken: Optional[str] = Field(default=None, max_length=2048)

    @field_validator("phoneNumber")
    @classmethod
    def normalize_phone_number(cls, value: str) -> str:
        return _normalize_phone_number(value)

    @field_validator("turnstileToken")
    @classmethod
    def normalize_turnstile_token(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class VerifySmsCodeRequest(BaseModel):
    phoneNumber: str = Field(..., min_length=8, max_length=32)
    code: str = Field(..., min_length=4, max_length=10)

    @field_validator("phoneNumber")
    @classmethod
    def normalize_phone_number(cls, value: str) -> str:
        return _normalize_phone_number(value)

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value: str) -> str:
        normalized = "".join(character for character in value.strip() if character.isdigit())
        if len(normalized) < 4:
            raise ValueError("SMS verification code is required")
        return normalized


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class SmsVerificationResponse(BaseModel):
    ok: bool = True
    message: str


class SmsVerificationCheckResponse(SmsVerificationResponse):
    verificationToken: str


def _normalize_phone_number(value: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        raise ValueError("Phone number is required")

    if cleaned.startswith("00"):
        cleaned = f"+{cleaned[2:]}"

    if cleaned.startswith("+"):
        digits = "".join(character for character in cleaned[1:] if character.isdigit())
    else:
        digits = "".join(character for character in cleaned if character.isdigit())
        if len(digits) in {10, 11}:
            digits = f"55{digits}"

    if not 10 <= len(digits) <= 15:
        raise ValueError("Invalid phone number")
    return f"+{digits}"


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "avatarUrl": user.avatar_url,
        "authProvider": user.auth_provider or "password",
        "isActive": user.is_active,
        "licenseStatus": user.license_status or "inactive",
        "licensePlan": user.license_plan,
        "licenseActivatedAt": user.license_activated_at.isoformat() if user.license_activated_at else None,
        "licenseExpiresAt": user.license_expires_at.isoformat() if user.license_expires_at else None,
        "trialEditCreditsRemaining": user_trial_edit_credits_remaining(user),
        "trialBlockedReason": user_trial_blocked_reason(user),
        "createdAt": user.created_at.isoformat() if user.created_at else None,
    }


def _oauth_callback_uri(provider: str) -> str:
    return f"{settings.BACKEND_PUBLIC_URL.rstrip('/')}/api/v1/auth/oauth/{provider}/callback"


def _default_frontend_callback() -> str:
    return f"{settings.FRONTEND_PUBLIC_URL.rstrip('/')}/auth/callback"


def _normalize_frontend_redirect(redirect_to: str | None) -> str:
    candidate = (redirect_to or _default_frontend_callback()).strip()
    parsed = urlparse(candidate)
    if parsed.scheme != "https" and settings.is_production:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OAuth redirect must use HTTPS")
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OAuth redirect target")

    allowed_origins = set(settings.cors_origins_list)
    candidate_origin = f"{parsed.scheme}://{parsed.netloc}"
    if candidate_origin not in allowed_origins:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OAuth redirect target is not allowed")

    path = parsed.path or "/auth/callback"
    if path != "/auth/callback":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OAuth redirect target path is not allowed")
    return f"{candidate_origin}{path}"


def _encode_oauth_state(provider: str, redirect_to: str, device_fingerprint_hash: str | None) -> str:
    expires_at = datetime.utcnow() + timedelta(minutes=settings.OAUTH_STATE_EXPIRE_MINUTES)
    payload = {
        "type": "oauth_state",
        "provider": provider,
        "redirect_to": redirect_to,
        "device_fingerprint_hash": device_fingerprint_hash,
        "nonce": secrets.token_urlsafe(12),
        "exp": expires_at,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)


def _encode_sms_verification_token(phone_number: str) -> str:
    expires_at = datetime.utcnow() + timedelta(minutes=settings.SMS_VERIFICATION_TOKEN_EXPIRE_MINUTES)
    payload = {
        "type": "sms_verification",
        "phone_number": phone_number,
        "nonce": secrets.token_urlsafe(12),
        "exp": expires_at,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)


def _decode_sms_verification_token(phone_number: str, verification_token: str) -> None:
    try:
        payload = jwt.decode(verification_token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="SMS verification expired or invalid") from exc
    if payload.get("type") != "sms_verification" or payload.get("phone_number") != phone_number:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="SMS verification expired or invalid")


def _decode_oauth_state(provider: str, state: str) -> dict:
    try:
        payload = jwt.decode(state, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OAuth state") from exc
    if payload.get("type") != "oauth_state" or payload.get("provider") != provider:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OAuth state")
    return payload


def _oauth_subject_field(provider: str) -> str:
    if provider == "google":
        return "google_subject"
    if provider == "discord":
        return "discord_subject"
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unsupported OAuth provider")


def _build_oauth_error_redirect(redirect_to: str, message: str) -> RedirectResponse:
    return RedirectResponse(url=f"{redirect_to}#error={quote(message)}", status_code=status.HTTP_302_FOUND)


def _build_oauth_success_redirect(redirect_to: str, user: User) -> RedirectResponse:
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    user_payload = quote(TokenResponse(access_token=access_token, refresh_token=refresh_token, user=serialize_user(user)).model_dump_json())
    return RedirectResponse(
        url=f"{redirect_to}#access_token={quote(access_token)}&refresh_token={quote(refresh_token)}&user={user_payload}",
        status_code=status.HTTP_302_FOUND,
    )


def _upsert_oauth_user(db: Session, request: Request, identity: OAuthIdentity, device_fingerprint_hash: str | None) -> User:
    subject_field = _oauth_subject_field(identity.provider)
    client_ip_hash = hash_abuse_signal(extract_client_ip(request))
    existing_by_subject = db.query(User).filter(getattr(User, subject_field) == identity.subject).first()
    if existing_by_subject:
        existing_by_subject.email = identity.email
        existing_by_subject.name = identity.name or existing_by_subject.name
        existing_by_subject.avatar_url = identity.avatar_url or existing_by_subject.avatar_url
        existing_by_subject.auth_provider = identity.provider
        existing_by_subject.last_ip_hash = client_ip_hash
        if device_fingerprint_hash:
            existing_by_subject.device_fingerprint_hash = device_fingerprint_hash
        db.commit()
        db.refresh(existing_by_subject)
        return existing_by_subject

    existing_by_email = db.query(User).filter(User.email == identity.email).first()
    if existing_by_email:
        if existing_by_email.auth_provider != identity.provider:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists with another sign-in method",
            )
        setattr(existing_by_email, subject_field, identity.subject)
        existing_by_email.name = identity.name or existing_by_email.name
        existing_by_email.avatar_url = identity.avatar_url or existing_by_email.avatar_url
        existing_by_email.last_ip_hash = client_ip_hash
        if device_fingerprint_hash:
            existing_by_email.device_fingerprint_hash = device_fingerprint_hash
        db.commit()
        db.refresh(existing_by_email)
        return existing_by_email

    trial_blocked_reason = determine_trial_block_reason(
        db,
        auth_provider=identity.provider,
        signup_ip_hash=client_ip_hash,
        device_fingerprint_hash=device_fingerprint_hash,
    )
    trial_credits = settings.TRIAL_INITIAL_EDIT_CREDITS if trial_blocked_reason is None else 0
    trial_granted_at = datetime.utcnow() if trial_credits > 0 else None
    user = User(
        email=identity.email,
        hashed_password=get_password_hash(secrets.token_urlsafe(32)),
        name=identity.name,
        avatar_url=identity.avatar_url,
        auth_provider=identity.provider,
        is_active=True,
        license_status="inactive",
        trial_edit_credits_remaining=trial_credits,
        trial_blocked_reason=trial_blocked_reason,
        trial_granted_at=trial_granted_at,
        signup_ip_hash=client_ip_hash,
        last_ip_hash=client_ip_hash,
        device_fingerprint_hash=device_fingerprint_hash,
    )
    setattr(user, subject_field, identity.subject)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


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
    existing_phone = db.query(User).filter(User.phone_number == payload.phoneNumber).first()
    if existing_phone:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Phone number already registered")
    if is_disposable_email(payload.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Disposable email addresses are not allowed")
    _decode_sms_verification_token(payload.phoneNumber, payload.smsVerificationToken)

    client_ip = extract_client_ip(request)
    signup_ip_hash = hash_abuse_signal(client_ip)
    device_fingerprint_hash = hash_abuse_signal(payload.deviceFingerprint)
    trial_blocked_reason = determine_trial_block_reason(
        db,
        auth_provider="password",
        signup_ip_hash=signup_ip_hash,
        device_fingerprint_hash=device_fingerprint_hash,
    )
    trial_credits = settings.TRIAL_INITIAL_EDIT_CREDITS if trial_blocked_reason is None else 0
    trial_granted_at = datetime.utcnow() if trial_credits > 0 else None

    user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        name=payload.name,
        phone_number=payload.phoneNumber,
        phone_verified_at=datetime.utcnow(),
        auth_provider="password",
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


@router.post("/sms/send-code", response_model=SmsVerificationResponse)
async def send_sms_code(payload: SendSmsVerificationRequest, request: Request):
    if not settings.sms_verification_configured:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="SMS verification is not configured")

    client_ip = extract_client_ip(request)
    if settings.TURNSTILE_SECRET_KEY:
        if not payload.turnstileToken:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Turnstile token is required")
        if not await verify_turnstile_token(payload.turnstileToken, client_ip):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Turnstile verification failed")

    try:
        await send_sms_verification_code(payload.phoneNumber)
    except SmsVerificationError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover
        logger.exception("Failed to send SMS verification code")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Could not send SMS verification code") from exc

    return {"ok": True, "message": "Codigo enviado por SMS"}


@router.post("/sms/verify-code", response_model=SmsVerificationCheckResponse)
async def verify_sms_code(payload: VerifySmsCodeRequest):
    if not settings.sms_verification_configured:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="SMS verification is not configured")

    try:
        approved = await check_sms_verification_code(payload.phoneNumber, payload.code)
    except SmsVerificationError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover
        logger.exception("Failed to verify SMS code")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Could not verify SMS code") from exc

    if not approved:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Codigo SMS invalido")

    return {
        "ok": True,
        "message": "Telefone verificado",
        "verificationToken": _encode_sms_verification_token(payload.phoneNumber),
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


@router.post("/oauth/{provider}/start")
async def oauth_start(provider: str, payload: OAuthStartRequest):
    normalized_provider = provider.strip().lower()
    redirect_to = _normalize_frontend_redirect(payload.redirectTo)
    device_fingerprint_hash = hash_abuse_signal(payload.deviceFingerprint)
    state = _encode_oauth_state(normalized_provider, redirect_to, device_fingerprint_hash)
    authorization_url = build_oauth_authorization_url(
        normalized_provider,
        _oauth_callback_uri(normalized_provider),
        state,
    )
    return {"authorizationUrl": authorization_url}


@router.get("/oauth/{provider}/callback")
async def oauth_callback(provider: str, code: str, state: str, request: Request, db: Session = Depends(get_db)):
    normalized_provider = provider.strip().lower()
    state_payload = _decode_oauth_state(normalized_provider, state)
    redirect_to = _normalize_frontend_redirect(state_payload.get("redirect_to"))
    try:
        identity = await exchange_code_for_identity(normalized_provider, code, _oauth_callback_uri(normalized_provider))
        user = _upsert_oauth_user(db, request, identity, state_payload.get("device_fingerprint_hash"))
    except HTTPException as exc:
        return _build_oauth_error_redirect(redirect_to, exc.detail if isinstance(exc.detail, str) else "OAuth login failed")
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Failed to finalize OAuth login")
        return _build_oauth_error_redirect(redirect_to, "Nao foi possivel finalizar o login social")

    return _build_oauth_success_redirect(redirect_to, user)


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
