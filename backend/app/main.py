"""FastAPI application bootstrap for AREA 69 Backend (Phase 1)"""
from __future__ import annotations

import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text

from app.api.v1.endpoints import auth as auth_routes
from app.api.v1.endpoints import health as health_routes
from app.api.v1.endpoints import lora as lora_routes
from app.api.v1.endpoints import generate as generate_routes
from app.api.v1.endpoints import user as user_routes
from app.api.v1.endpoints import payments as payments_routes
from app.api import upload as upload_routes
from app.core.config import Settings

logger = logging.getLogger(__name__)
settings = Settings()


def _storage_directory() -> str:
    candidate_paths = [
        Path("/app/storage"),
        Path(__file__).resolve().parents[1] / "storage",
    ]
    for path in candidate_paths:
        if path.exists():
            return str(path)

    fallback = candidate_paths[-1]
    fallback.mkdir(parents=True, exist_ok=True)
    return str(fallback)


def _ensure_user_columns(engine) -> None:
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("users")}
    missing_columns = {
        "license_key": "ALTER TABLE users ADD COLUMN license_key VARCHAR(128)",
        "license_status": "ALTER TABLE users ADD COLUMN license_status VARCHAR(50) DEFAULT 'inactive'",
        "license_plan": "ALTER TABLE users ADD COLUMN license_plan VARCHAR(100)",
        "license_activated_at": "ALTER TABLE users ADD COLUMN license_activated_at TIMESTAMP",
        "license_expires_at": "ALTER TABLE users ADD COLUMN license_expires_at TIMESTAMP",
    }

    with engine.begin() as connection:
        for column_name, sql in missing_columns.items():
            if column_name not in existing_columns:
                connection.execute(text(sql))


def create_app() -> FastAPI:
    app = FastAPI(
        title="AREA 69 Backend",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    origins = ["http://localhost:3003", "http://127.0.0.1:3003", "*"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_routes.router, prefix="/api/v1")
    app.include_router(auth_routes.router, prefix="/api/v1")
    app.include_router(lora_routes.router, prefix="/api/v1")
    app.include_router(generate_routes.router, prefix="/api/v1")
    app.include_router(user_routes.router, prefix="/api/v1")
    app.include_router(payments_routes.router, prefix="/api/v1")
    app.include_router(upload_routes.router, prefix="/api/v1")

    app.mount("/storage", StaticFiles(directory=_storage_directory()), name="storage")

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
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
