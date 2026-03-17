from __future__ import annotations

from datetime import UTC, datetime
import time

import httpx
from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.core.config import settings
from app.models.database import engine
from app.services.higgsfield_service import HiggsfieldService
from app.services.r2_storage import R2Storage
from app.services.wavespeed_service import WaveSpeedService

router = APIRouter()


def _timestamp() -> str:
    return datetime.now(UTC).isoformat()


def _duration_ms(start_time: float) -> float:
    return round((time.perf_counter() - start_time) * 1000, 2)


async def check_database_health() -> dict:
    start_time = time.perf_counter()
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "critical": True,
            "latencyMs": _duration_ms(start_time),
        }
    except Exception as exc:
        return {
            "status": "error",
            "critical": True,
            "latencyMs": _duration_ms(start_time),
            "detail": str(exc),
        }


async def check_r2_health() -> dict:
    start_time = time.perf_counter()
    configured = bool(
        settings.R2_ACCOUNT_ID
        and settings.R2_ACCESS_KEY_ID
        and settings.R2_SECRET_ACCESS_KEY
        and settings.R2_BUCKET_NAME
    )
    if not configured:
        return {
            "status": "error",
            "critical": True,
            "detail": "missing_config",
            "bucket": settings.R2_BUCKET_NAME,
            "latencyMs": _duration_ms(start_time),
        }

    try:
        storage = R2Storage()
        storage.client.head_bucket(Bucket=storage.bucket_name)
        return {
            "status": "ok",
            "critical": True,
            "bucket": storage.bucket_name,
            "latencyMs": _duration_ms(start_time),
        }
    except Exception as exc:
        return {
            "status": "error",
            "critical": True,
            "bucket": settings.R2_BUCKET_NAME,
            "latencyMs": _duration_ms(start_time),
            "detail": str(exc),
        }


async def _check_http_provider(*, configured: bool, name: str, client: httpx.AsyncClient, path: str, headers: dict[str, str]) -> dict:
    start_time = time.perf_counter()
    if not configured:
        return {
            "status": "error",
            "critical": True,
            "detail": "missing_config",
            "latencyMs": _duration_ms(start_time),
        }

    try:
        response = await client.get(path, headers=headers)
        if response.status_code in {401, 403}:
            return {
                "status": "error",
                "critical": True,
                "detail": "auth_failed",
                "statusCode": response.status_code,
                "latencyMs": _duration_ms(start_time),
            }
        if response.status_code >= 500:
            return {
                "status": "error",
                "critical": True,
                "detail": f"{name.lower()}_upstream_error",
                "statusCode": response.status_code,
                "latencyMs": _duration_ms(start_time),
            }
        return {
            "status": "ok",
            "critical": True,
            "detail": "reachable",
            "statusCode": response.status_code,
            "latencyMs": _duration_ms(start_time),
        }
    except Exception as exc:
        return {
            "status": "error",
            "critical": True,
            "detail": str(exc),
            "latencyMs": _duration_ms(start_time),
        }


async def check_higgsfield_health() -> dict:
    service = HiggsfieldService()
    try:
        return await _check_http_provider(
            configured=service.is_configured,
            name="Higgsfield",
            client=service.client,
            path="/requests/00000000-0000-0000-0000-000000000000/status",
            headers=service._request_headers(),
        )
    finally:
        await service.client.aclose()


async def check_wavespeed_health() -> dict:
    service = WaveSpeedService()
    try:
        return await _check_http_provider(
            configured=bool(service.api_key),
            name="WaveSpeed",
            client=service.client,
            path="/predictions/health-check",
            headers=service._headers(),
        )
    finally:
        await service.client.aclose()


def check_processing_mode() -> dict:
    return {
        "status": "ok",
        "critical": False,
        "mode": "synchronous",
        "brokerConfigured": bool(settings.REDIS_URL),
    }


@router.api_route("/health", methods=["GET", "HEAD"])
async def health() -> dict:
    return {
        "status": "ok",
        "timestamp": _timestamp(),
    }


@router.api_route("/health/ready", methods=["GET", "HEAD"])
async def readiness() -> JSONResponse:
    checks = {
        "database": await check_database_health(),
        "storage": await check_r2_health(),
        "generation": {
            "higgsfield": await check_higgsfield_health(),
            "wavespeed": await check_wavespeed_health(),
        },
        "processing": check_processing_mode(),
    }

    critical_checks = [
        checks["database"],
        checks["storage"],
        checks["generation"]["higgsfield"],
        checks["generation"]["wavespeed"],
    ]
    ready = all(check["status"] == "ok" for check in critical_checks)
    payload = {
        "status": "ok" if ready else "error",
        "ready": ready,
        "timestamp": _timestamp(),
        "environment": settings.ENVIRONMENT,
        "checks": checks,
    }
    return JSONResponse(
        status_code=status.HTTP_200_OK if ready else status.HTTP_503_SERVICE_UNAVAILABLE,
        content=payload,
    )
