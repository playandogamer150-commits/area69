from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.security import create_access_token, create_refresh_token, get_current_user, get_password_hash, verify_password
from app.models.database import LicenseKey, User, get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])
settings = Settings()


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class ActivateLicenseRequest(BaseModel):
    licenseKey: str


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None


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
        "createdAt": user.created_at.isoformat() if user.created_at else None,
    }


@router.post("/register", response_model=TokenResponse)
async def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    name = payload.name.strip() if payload.name else None

    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        email=email,
        hashed_password=get_password_hash(payload.password),
        name=name,
        is_active=True,
        license_status="inactive",
    )
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar usuario no banco de dados: {exc}",
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
async def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

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
        current_user.name = payload.name.strip() or None
    db.commit()
    db.refresh(current_user)
    return serialize_user(current_user)


@router.post("/activate-license")
async def activate_license(
    payload: ActivateLicenseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    normalized_key = payload.licenseKey.strip().upper()
    license_key = db.query(LicenseKey).filter(LicenseKey.key == normalized_key).first()
    if not license_key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="License key not found")
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
