from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from urllib.parse import urlencode

import httpx
from fastapi import HTTPException, status

from app.core.config import settings


@dataclass(frozen=True)
class OAuthProviderConfig:
    provider: str
    client_id: str
    client_secret: str
    authorize_url: str
    token_url: str
    userinfo_url: str
    scopes: tuple[str, ...]


@dataclass(frozen=True)
class OAuthIdentity:
    provider: str
    subject: str
    email: str
    name: str | None
    email_verified: bool


def get_oauth_provider_config(provider: str) -> OAuthProviderConfig:
    normalized = provider.strip().lower()
    if normalized == "google":
        if not settings.GOOGLE_OAUTH_CLIENT_ID or not settings.GOOGLE_OAUTH_CLIENT_SECRET:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Google OAuth is not configured")
        return OAuthProviderConfig(
            provider="google",
            client_id=settings.GOOGLE_OAUTH_CLIENT_ID,
            client_secret=settings.GOOGLE_OAUTH_CLIENT_SECRET,
            authorize_url=settings.GOOGLE_OAUTH_AUTH_URL,
            token_url=settings.GOOGLE_OAUTH_TOKEN_URL,
            userinfo_url=settings.GOOGLE_OAUTH_USERINFO_URL,
            scopes=("openid", "email", "profile"),
        )
    if normalized == "discord":
        if not settings.DISCORD_OAUTH_CLIENT_ID or not settings.DISCORD_OAUTH_CLIENT_SECRET:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Discord OAuth is not configured")
        return OAuthProviderConfig(
            provider="discord",
            client_id=settings.DISCORD_OAUTH_CLIENT_ID,
            client_secret=settings.DISCORD_OAUTH_CLIENT_SECRET,
            authorize_url=settings.DISCORD_OAUTH_AUTH_URL,
            token_url=settings.DISCORD_OAUTH_TOKEN_URL,
            userinfo_url=settings.DISCORD_OAUTH_USERINFO_URL,
            scopes=("identify", "email"),
        )
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unsupported OAuth provider")


def build_oauth_authorization_url(provider: str, redirect_uri: str, state: str) -> str:
    config = get_oauth_provider_config(provider)
    params = {
        "client_id": config.client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(config.scopes),
        "state": state,
    }
    if config.provider == "google":
        params["access_type"] = "offline"
        params["prompt"] = "select_account"
    return f"{config.authorize_url}?{urlencode(params)}"


async def exchange_code_for_identity(provider: str, code: str, redirect_uri: str) -> OAuthIdentity:
    config = get_oauth_provider_config(provider)
    async with httpx.AsyncClient(timeout=20.0) as client:
        token_response = await client.post(
            config.token_url,
            data={
                "client_id": config.client_id,
                "client_secret": config.client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
            },
            headers={"Accept": "application/json"},
        )
        if token_response.status_code >= 400:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{config.provider.title()} OAuth token exchange failed")

        token_payload = token_response.json()
        access_token = token_payload.get("access_token")
        if not access_token:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{config.provider.title()} OAuth token exchange failed")

        userinfo_response = await client.get(
            config.userinfo_url,
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
        )
        if userinfo_response.status_code >= 400:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{config.provider.title()} OAuth user lookup failed")

        payload = userinfo_response.json()
        return _parse_identity(config.provider, payload)


def _parse_identity(provider: str, payload: dict[str, Any]) -> OAuthIdentity:
    if provider == "google":
        subject = str(payload.get("sub") or "").strip()
        email = str(payload.get("email") or "").strip().lower()
        name = str(payload.get("name") or "").strip() or None
        email_verified = bool(payload.get("email_verified"))
    else:
        subject = str(payload.get("id") or "").strip()
        email = str(payload.get("email") or "").strip().lower()
        global_name = str(payload.get("global_name") or "").strip()
        username = str(payload.get("username") or "").strip()
        name = global_name or username or None
        email_verified = bool(payload.get("verified"))

    if not subject or not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{provider.title()} account did not provide a usable email")
    if not email_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{provider.title()} account email must be verified")

    return OAuthIdentity(
        provider=provider,
        subject=subject,
        email=email,
        name=name,
        email_verified=email_verified,
    )
