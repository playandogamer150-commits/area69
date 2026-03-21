"""FastAPI application bootstrap for AREA 69 Backend (Phase 1)"""
from __future__ import annotations

import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.api.v1.endpoints import auth as auth_routes
from app.api.v1.endpoints import health as health_routes
from app.api.v1.endpoints import generate as generate_routes
from app.api.v1.endpoints import user as user_routes
from app.api.v1.endpoints import webhooks as webhook_routes
from app.api import upload as upload_routes
from app.core.config import settings

logger = logging.getLogger(__name__)


def _ensure_user_columns(engine) -> None:
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("users")}
    missing_columns = {
        "phone_number": "ALTER TABLE users ADD COLUMN phone_number VARCHAR(32)",
        "phone_verified_at": "ALTER TABLE users ADD COLUMN phone_verified_at TIMESTAMP",
        "avatar_url": "ALTER TABLE users ADD COLUMN avatar_url VARCHAR(1024)",
        "auth_provider": "ALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'password'",
        "google_subject": "ALTER TABLE users ADD COLUMN google_subject VARCHAR(255)",
        "discord_subject": "ALTER TABLE users ADD COLUMN discord_subject VARCHAR(255)",
        "license_key": "ALTER TABLE users ADD COLUMN license_key VARCHAR(128)",
        "license_status": "ALTER TABLE users ADD COLUMN license_status VARCHAR(50) DEFAULT 'inactive'",
        "license_plan": "ALTER TABLE users ADD COLUMN license_plan VARCHAR(100)",
        "license_activated_at": "ALTER TABLE users ADD COLUMN license_activated_at TIMESTAMP",
        "license_expires_at": "ALTER TABLE users ADD COLUMN license_expires_at TIMESTAMP",
        "trial_edit_credits_remaining": "ALTER TABLE users ADD COLUMN trial_edit_credits_remaining INTEGER DEFAULT 2",
        "trial_blocked_reason": "ALTER TABLE users ADD COLUMN trial_blocked_reason VARCHAR(100)",
        "trial_granted_at": "ALTER TABLE users ADD COLUMN trial_granted_at TIMESTAMP",
        "signup_ip_hash": "ALTER TABLE users ADD COLUMN signup_ip_hash VARCHAR(64)",
        "last_ip_hash": "ALTER TABLE users ADD COLUMN last_ip_hash VARCHAR(64)",
        "device_fingerprint_hash": "ALTER TABLE users ADD COLUMN device_fingerprint_hash VARCHAR(64)",
    }

    with engine.begin() as connection:
        for column_name, sql in missing_columns.items():
            if column_name not in existing_columns:
                connection.execute(text(sql))


def _seed_license_keys(engine) -> None:
    app_file = Path(__file__).resolve()
    candidates = [
        app_file.parents[1] / "area69-license-seed.txt",
        app_file.parents[2] / "area69-license-seed.txt",
    ]
    seed_file = next((path for path in candidates if path.exists()), None)
    if seed_file is None:
        return

    from app.models.database import LicenseKey, SessionLocal

    keys = [line.strip().upper() for line in seed_file.read_text(encoding="utf-8").splitlines() if line.strip()]
    if not keys:
        return

    db: Session = SessionLocal()
    try:
        existing = {item.key for item in db.query(LicenseKey).filter(LicenseKey.key.in_(keys)).all()}
        new_items = [
            LicenseKey(key=item, plan_name="lifetime", is_active=True, max_activations=1, activations_count=0)
            for item in keys
            if item not in existing
        ]
        if new_items:
            db.add_all(new_items)
            db.commit()
            logger.info("Seeded %s license keys", len(new_items))
    finally:
        db.close()


def create_app() -> FastAPI:
    app = FastAPI(
        title="AREA 69 Backend",
        version="0.1.0",
        docs_url="/docs" if settings.ENABLE_API_DOCS else None,
        redoc_url="/redoc" if settings.ENABLE_API_DOCS else None,
    )

    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts_list)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_routes.router, prefix="/api/v1")
    app.include_router(auth_routes.router, prefix="/api/v1")
    app.include_router(generate_routes.router, prefix="/api/v1")
    app.include_router(user_routes.router, prefix="/api/v1")
    app.include_router(webhook_routes.router, prefix="/api/v1")
    app.include_router(upload_routes.router, prefix="/api/v1")

    settings.storage_path.mkdir(parents=True, exist_ok=True)
    app.mount("/storage", StaticFiles(directory=str(settings.storage_path)), name="storage")

    app.state.settings = settings
    return app


app = create_app()


@app.on_event("startup")
async def startup_db_client():
    """Create database tables on startup."""
    logger.info("Initializing database...")
    try:
        from app.models.database import Base, engine
        Base.metadata.create_all(bind=engine)
        _ensure_user_columns(engine)
        _seed_license_keys(engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
