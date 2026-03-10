from __future__ import annotations

from fastapi import APIRouter
from datetime import datetime

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
    }
