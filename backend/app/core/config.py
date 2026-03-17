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


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
