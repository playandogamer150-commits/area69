from __future__ import annotations

from typing import Any, Dict, List, Optional

import httpx

from app.core.config import Settings
from app.core.logging import get_logger

logger = get_logger(__name__)
settings = Settings()


class WaveSpeedService:
    def __init__(self, api_key: str | None = None) -> None:
        self.api_key = api_key or settings.WAVESPEED_API_KEY
        self.base_url = "https://api.wavespeed.ai/api/v3"
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=300.0)

    def _headers(self) -> Dict[str, str]:
        return {"Authorization": f"Bearer {self.api_key}"}

    def _normalize_prediction(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        data = payload.get("data") if isinstance(payload.get("data"), dict) else None
        normalized = data.copy() if data else payload.copy()
        for key in ("id", "status", "outputs", "error", "model", "input"):
            if key not in normalized and key in payload:
                normalized[key] = payload[key]
        return normalized

    async def upload_binary(self, file_content: bytes, file_name: str, content_type: str) -> Dict[str, Any]:
        files = {"file": (file_name, file_content, content_type)}
        response = await self.client.post(
            "/media/upload/binary",
            headers={"Authorization": f"Bearer {self.api_key}"},
            files=files,
        )
        if response.status_code == 200:
            payload = response.json()
            data = payload.get("data") if isinstance(payload.get("data"), dict) else None
            normalized = data.copy() if data else payload.copy()
            if "download_url" not in normalized and data and "download_url" in data:
                normalized["download_url"] = data["download_url"]
            logger.info("WaveSpeed upload response: %s", normalized)
            return normalized
        error_msg = f"WaveSpeed upload error: {response.status_code} - {response.text}"
        logger.error(error_msg)
        return {"error": error_msg, "status_code": response.status_code}

    async def submit_image_edit(
        self,
        images: List[str],
        prompt: str,
        size: Optional[str] = None,
        seed: int = -1,
    ) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "images": images,
            "prompt": prompt,
            "seed": seed,
        }
        if size:
            payload["size"] = size
        response = await self.client.post(
            "/wavespeed-ai/qwen-image-2.0-pro/edit",
            headers={**self._headers(), "Content-Type": "application/json"},
            json=payload,
        )
        if response.status_code in (200, 201):
            normalized = self._normalize_prediction(response.json())
            logger.info("WaveSpeed edit submit response: %s", normalized)
            return normalized
        error_msg = f"WaveSpeed edit error: {response.status_code} - {response.text}"
        logger.error(error_msg)
        return {"error": error_msg, "status_code": response.status_code}

    async def get_prediction(self, prediction_id: str) -> Dict[str, Any]:
        response = await self.client.get(
            f"/predictions/{prediction_id}",
            headers=self._headers(),
        )
        if response.status_code == 200:
            return self._normalize_prediction(response.json())
        error_msg = f"WaveSpeed status error: {response.status_code} - {response.text}"
        logger.error(error_msg)
        return {"error": error_msg, "status_code": response.status_code}

    async def get_result(self, prediction_id: str) -> Dict[str, Any]:
        response = await self.client.get(
            f"/predictions/{prediction_id}/result",
            headers=self._headers(),
        )
        if response.status_code == 200:
            return self._normalize_prediction(response.json())
        error_msg = f"WaveSpeed result error: {response.status_code} - {response.text}"
        logger.error(error_msg)
        return {"error": error_msg, "status_code": response.status_code}
