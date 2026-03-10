from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # API tokens and keys
    REPLICATE_API_TOKEN: str | None = Field(default=None, env="REPLICATE_API_TOKEN")
    REPLICATE_OWNER: str | None = Field(default=None, env="REPLICATE_OWNER")
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

    # Security
    JWT_SECRET_KEY: str = Field(..., env="JWT_SECRET_KEY")
    ALGORITHM: str = Field("HS256", env="ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(30, env="ACCESS_TOKEN_EXPIRE_MINUTES")

    # Efi Pix
    EFI_CLIENT_ID: str | None = Field(default=None, env="EFI_CLIENT_ID")
    EFI_CLIENT_SECRET: str | None = Field(default=None, env="EFI_CLIENT_SECRET")
    EFI_PIX_KEY: str | None = Field(default=None, env="EFI_PIX_KEY")
    EFI_CERT_PATH: str | None = Field(default=None, env="EFI_CERT_PATH")
    EFI_CERT_BASE64: str | None = Field(default=None, env="EFI_CERT_BASE64")
    EFI_CERT_PASSWORD: str = Field("", env="EFI_CERT_PASSWORD")
    EFI_SANDBOX: bool = Field(True, env="EFI_SANDBOX")
    PIX_DEFAULT_AMOUNT_CENTS: int = Field(4990, env="PIX_DEFAULT_AMOUNT_CENTS")

    class Config:
        env_file = ".env"
        case_sensitive = True


def get_settings() -> Settings:
    return Settings()
