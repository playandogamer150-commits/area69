from __future__ import annotations

from typing import Any

import httpx

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)
REALISTIC_STYLE_ID = "1cb4b936-77bf-4f9a-9039-f3d349a4cdbe"


class HiggsfieldService:
    def __init__(self) -> None:
        self.base_url = "https://platform.higgsfield.ai"
        self.api_key_id = settings.HIGGSFIELD_API_KEY_ID
        self.api_key_secret = settings.HIGGSFIELD_API_KEY_SECRET
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=120.0)

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key_id and self.api_key_secret)

    def _custom_reference_headers(self) -> dict[str, str]:
        return {
            "hf-api-key": self.api_key_id or "",
            "hf-secret": self.api_key_secret or "",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def _request_headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Key {self.api_key_id}:{self.api_key_secret}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    async def _request(self, method: str, endpoint: str, *, headers: dict[str, str], **kwargs: Any) -> dict[str, Any]:
        response = await self.client.request(method, endpoint, headers=headers, **kwargs)
        if response.status_code in (200, 201):
            return response.json()
        if response.status_code == 204:
            return {"ok": True}

        error_message = f"Higgsfield API error: {response.status_code} - {response.text}"
        logger.error(error_message)
        return {"error": error_message, "status_code": response.status_code}

    async def create_soul_id(self, name: str, input_images: list[str]) -> dict[str, Any]:
        body = {
            "name": name,
            "input_images": [
                {
                    "type": "image_url",
                    "image_url": image_url,
                }
                for image_url in input_images
            ],
        }
        return await self._request(
            "POST",
            "/v1/custom-references",
            headers=self._custom_reference_headers(),
            json=body,
        )

    async def get_soul_id(self, reference_id: str) -> dict[str, Any]:
        return await self._request(
            "GET",
            f"/v1/custom-references/{reference_id}",
            headers=self._custom_reference_headers(),
        )

    async def delete_soul_id(self, reference_id: str) -> dict[str, Any]:
        return await self._request(
            "DELETE",
            f"/v1/custom-references/{reference_id}",
            headers=self._custom_reference_headers(),
        )

    async def create_soul_character_image(
        self,
        *,
        prompt: str,
        character_id: str,
        character_name: str,
        width: int,
        height: int,
        result_images: int,
        reference_image_urls: list[str] | None = None,
    ) -> dict[str, Any]:
        normalized_reference_urls = [
            url.strip()
            for url in (reference_image_urls or [])
            if isinstance(url, str) and url.strip().startswith("http")
        ][:5]

        body = {
            "prompt": prompt,
            "width": width,
            "height": height,
            "enhance_prompt": True,
            "style_id": REALISTIC_STYLE_ID,
            "style_strength": 1,
            "custom_reference": {
                "id": character_id,
                "name": character_name,
            },
            "image_reference": normalized_reference_urls[0] if normalized_reference_urls else None,
        }
        if result_images != 1:
            body["result_images"] = result_images
        logger.info("Soul Character payload: %s", body)
        return await self._request(
            "POST",
            "/higgsfield-ai/soul/character",
            headers=self._request_headers(),
            json=body,
        )

    async def get_request_status(self, request_id: str) -> dict[str, Any]:
        return await self._request(
            "GET",
            f"/requests/{request_id}/status",
            headers=self._request_headers(),
        )

    async def cancel_request(self, request_id: str) -> dict[str, Any]:
        return await self._request(
            "POST",
            f"/requests/{request_id}/cancel",
            headers=self._request_headers(),
        )
