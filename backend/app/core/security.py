from datetime import datetime, timedelta
import hashlib
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.anti_abuse import SOCIAL_TRIAL_PROVIDERS, normalize_auth_provider
from app.core.config import settings
from app.models.database import User, get_db

pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def user_has_active_license(user: User) -> bool:
    return (user.license_status or "inactive") == "active"


def user_auth_provider(user: User) -> str:
    return normalize_auth_provider(user.auth_provider)


def user_has_social_trial_provider(user: User) -> bool:
    return user_auth_provider(user) in SOCIAL_TRIAL_PROVIDERS


def user_trial_edit_credits_remaining(user: User) -> int:
    if not user_has_social_trial_provider(user):
        return 0
    return max(user.trial_edit_credits_remaining or 0, 0)


def user_trial_blocked_reason(user: User) -> str | None:
    if user_has_active_license(user):
        return None
    if user_has_social_trial_provider(user):
        return user.trial_blocked_reason
    return user.trial_blocked_reason or "social_login_required"


def user_has_image_edit_trial_access(user: User) -> bool:
    return user_has_active_license(user) or user_trial_edit_credits_remaining(user) > 0


def verify_password(plain_password: str, hashed_password: str) -> bool:
    normalized = hashlib.sha256(plain_password.encode("utf-8")).hexdigest()
    return pwd_context.verify(normalized, hashed_password)


def get_password_hash(password: str) -> str:
    normalized = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return pwd_context.hash(normalized)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    if payload.get("type") == "refresh":
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_current_licensed_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    if not user_has_active_license(current_user):
        raise HTTPException(status_code=403, detail="Active license required")
    return current_user


async def get_current_image_edit_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    if not user_has_image_edit_trial_access(current_user):
        raise HTTPException(status_code=403, detail="Image edit trial exhausted")
    return current_user
