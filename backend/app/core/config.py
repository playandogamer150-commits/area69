from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # API tokens and keys
    REPLICATE_API_TOKEN: str | None = Field(default=None, env="REPLICATE_API_TOKEN")
    REPLICATE_OWNER: str | None = Field(default=None, env="REPLICATE_OWNER")
    HIGGSFIELD_API_KEY_ID: str | None = Field(default=None, env="HIGGSFIELD_API_KEY_ID")
    HIGGSFIELD_API_KEY_SECRET: str | None = Field(default=None, env="HIGGSFIELD_API_KEY_SECRET")
    WAVESPEED_API_KEY: str | None = Field(default=None, env="WAVESPEED_API_KEY")
    FAL_KEY: str | None = Field(default=None, env="FAL_KEY")

    # Cloud storage / DB
    R2_ACCOUNT_ID: str | None = Field(default=None, env="R2_ACCOUNT_ID")
    R2_ACCESS_KEY_ID: str | None = Field(default=None, env="R2_ACCESS_KEY_ID")
    R2_SECRET_ACCESS_KEY: str | None = Field(default=None, env="R2_SECRET_ACCESS_KEY")
    R2_BUCKET_NAME: str | None = Field(default=None, env="R2_BUCKET_NAME")
    R2_PUBLIC_BASE_URL: str | None = Field(default=None, env="R2_PUBLIC_BASE_URL")
    DATABASE_URL: str = Field("sqlite:///./area69.db", env="DATABASE_URL")
    REDIS_URL: str = Field("redis://localhost:6379/0", env="REDIS_URL")
    BACKEND_PUBLIC_URL: str = Field("http://localhost:8000", env="BACKEND_PUBLIC_URL")
    INTERNAL_API_BASE_URL: str | None = Field(default=None, env="INTERNAL_API_BASE_URL")
    STORAGE_PATH: str = Field("./storage", env="STORAGE_PATH")
    CORS_ORIGINS: str = Field(
        "http://localhost:3000,http://localhost:3003,http://127.0.0.1:3000,http://127.0.0.1:3003",
        env="CORS_ORIGINS",
    )
    ALLOWED_HOSTS: str = Field("localhost,127.0.0.1,testserver", env="ALLOWED_HOSTS")
    ENABLE_API_DOCS: bool = Field(True, env="ENABLE_API_DOCS")
    ENVIRONMENT: str = Field("development", env="ENVIRONMENT")
    LOG_LEVEL: str = Field("INFO", env="LOG_LEVEL")

    # Security
    JWT_SECRET_KEY: str = Field(..., env="JWT_SECRET_KEY")
    ALGORITHM: str = Field("HS256", env="ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    REPLICATE_WEBHOOK_SECRET: str | None = Field(default=None, env="REPLICATE_WEBHOOK_SECRET")
    FAL_WEBHOOK_SECRET: str | None = Field(default=None, env="FAL_WEBHOOK_SECRET")
    TURNSTILE_SECRET_KEY: str | None = Field(default=None, env="TURNSTILE_SECRET_KEY")
    TURNSTILE_SITEVERIFY_URL: str = Field(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        env="TURNSTILE_SITEVERIFY_URL",
    )
    TWILIO_ACCOUNT_SID: str | None = Field(default=None, env="TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN: str | None = Field(default=None, env="TWILIO_AUTH_TOKEN")
    TWILIO_VERIFY_SERVICE_SID: str | None = Field(default=None, env="TWILIO_VERIFY_SERVICE_SID")
    TWILIO_VERIFY_BASE_URL: str = Field(
        "https://verify.twilio.com/v2",
        env="TWILIO_VERIFY_BASE_URL",
    )
    SMS_VERIFICATION_TOKEN_EXPIRE_MINUTES: int = Field(15, env="SMS_VERIFICATION_TOKEN_EXPIRE_MINUTES")
    TRIAL_INITIAL_EDIT_CREDITS: int = Field(2, env="TRIAL_INITIAL_EDIT_CREDITS")
    TRIAL_MAX_ACCOUNTS_PER_IP: int = Field(2, env="TRIAL_MAX_ACCOUNTS_PER_IP")
    FRONTEND_PUBLIC_URL: str = Field("http://localhost:3000", env="FRONTEND_PUBLIC_URL")
    OAUTH_STATE_EXPIRE_MINUTES: int = Field(10, env="OAUTH_STATE_EXPIRE_MINUTES")
    GOOGLE_OAUTH_CLIENT_ID: str | None = Field(default=None, env="GOOGLE_OAUTH_CLIENT_ID")
    GOOGLE_OAUTH_CLIENT_SECRET: str | None = Field(default=None, env="GOOGLE_OAUTH_CLIENT_SECRET")
    GOOGLE_OAUTH_AUTH_URL: str = Field(
        "https://accounts.google.com/o/oauth2/v2/auth",
        env="GOOGLE_OAUTH_AUTH_URL",
    )
    GOOGLE_OAUTH_TOKEN_URL: str = Field(
        "https://oauth2.googleapis.com/token",
        env="GOOGLE_OAUTH_TOKEN_URL",
    )
    GOOGLE_OAUTH_USERINFO_URL: str = Field(
        "https://openidconnect.googleapis.com/v1/userinfo",
        env="GOOGLE_OAUTH_USERINFO_URL",
    )
    DISCORD_OAUTH_CLIENT_ID: str | None = Field(default=None, env="DISCORD_OAUTH_CLIENT_ID")
    DISCORD_OAUTH_CLIENT_SECRET: str | None = Field(default=None, env="DISCORD_OAUTH_CLIENT_SECRET")
    DISCORD_OAUTH_AUTH_URL: str = Field(
        "https://discord.com/oauth2/authorize",
        env="DISCORD_OAUTH_AUTH_URL",
    )
    DISCORD_OAUTH_TOKEN_URL: str = Field(
        "https://discord.com/api/oauth2/token",
        env="DISCORD_OAUTH_TOKEN_URL",
    )
    DISCORD_OAUTH_USERINFO_URL: str = Field(
        "https://discord.com/api/users/@me",
        env="DISCORD_OAUTH_USERINFO_URL",
    )

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def internal_api_base_url(self) -> str:
        return (self.INTERNAL_API_BASE_URL or self.BACKEND_PUBLIC_URL).rstrip("/")

    @property
    def storage_path(self) -> Path:
        return Path(self.STORAGE_PATH).resolve()

    @property
    def allowed_hosts_list(self) -> list[str]:
        hosts = [host.strip() for host in self.ALLOWED_HOSTS.split(",") if host.strip()]
        return hosts or ["localhost", "127.0.0.1"]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.strip().lower() == "production"

    @property
    def sms_verification_configured(self) -> bool:
        return bool(self.TWILIO_ACCOUNT_SID and self.TWILIO_AUTH_TOKEN and self.TWILIO_VERIFY_SERVICE_SID)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
