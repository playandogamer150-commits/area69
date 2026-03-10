from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class FalService:
    def __init__(self, key: str | None = None) -> None:
        self.key = key or settings.FAL_KEY
        self.base_url = "https://queue.fal.ai"
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=180.0)
    
    async def _request(
        self,
        method: str,
        endpoint: str,
        files: Optional[Dict] = None,
        data: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        headers = {"Authorization": f"Bearer {self.key}"}
        
        try:
            resp = await self.client.request(
                method,
                endpoint,
                headers=headers,
                files=files,
                data=data,
            )
            
            if resp.status_code in (200, 201, 202):
                content_type = resp.headers.get("content-type", "")
                if "application/json" in content_type:
                    return resp.json()
                return {"result": resp.text}
            
            error_msg = f"Fal.ai API error: {resp.status_code} - {resp.text}"
            logger.error(error_msg)
            return {"error": error_msg, "status_code": resp.status_code}
            
        except Exception as e:
            logger.error(f"Fal.ai request failed: {str(e)}")
            return {"error": str(e)}

    async def submit(
        self,
        model_name: str,
        input_params: Dict[str, Any],
        webhook_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Submit a job to Fal.ai queue."""
        data = {
            "model": model_name,
            "input": input_params,
        }
        if webhook_url:
            data["webhook_url"] = webhook_url
            
        return await self._request("POST", "/submit", data=json.dumps(data))

    async def get_result(self, request_id: str) -> Dict[str, Any]:
        """Get job result by request ID."""
        return await self._request("GET", f"/requests/{request_id}")

    async def train_and_host_lora(
        self,
        reference_images: List[str],
        trigger_word: str,
        steps: int = 1000,
        enable_nsfw: bool = True,
    ) -> Dict[str, Any]:
        """Train LoRA and host on Fal.ai."""
        input_params = {
            "images": reference_images,
            "trigger_word": trigger_word,
            "steps": steps,
            "enable_nsfw": enable_nsfw,
        }
        
        result = await self.submit(
            model_name="fal-ai/flux-lora-training",
            input_params=input_params,
        )
        
        return {
            "lora_id": result.get("request_id"),
            "fal_lora_url": result.get("output", {}).get("lora_url"),
            "status": "training" if result.get("status") == "IN_PROGRESS" else "ready",
        }

    async def generate_flux_nsfw(
        self,
        prompt: str,
        negative_prompt: str = "",
        lora_url: Optional[str] = None,
        lora_strength: float = 0.8,
        width: int = 1024,
        height: int = 1024,
        seed: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Generate image using Flux NSFW model."""
        input_params = {
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "image_size": {"width": width, "height": height},
            "num_inference_steps": 30,
            "guidance_scale": 7.0,
            "enable_safety_checker": False,
        }
        
        if lora_url:
            input_params["lora_url"] = lora_url
            input_params["lora_scale"] = lora_strength
        
        if seed:
            input_params["seed"] = seed
        
        result = await self.submit(
            model_name="fal-ai/flux/dev",
            input_params=input_params,
        )
        
        images = result.get("output", {}).get("images", [])
        image_url = images[0].get("url") if images else None
        
        return {
            "image_url": image_url,
            "status": "completed" if image_url else "processing",
            "request_id": result.get("request_id"),
        }

    async def check_nsfw_content(self, image_url: str) -> Dict[str, Any]:
        """Check if image contains NSFW content."""
        input_params = {"image_url": image_url}
        
        result = await self.submit(
            model_name="fal-ai/x-ailab/nsfw",
            input_params=input_params,
        )
        
        return {
            "is_nsfw": result.get("output", {}).get("is_nsfw", False),
            "nsfw_score": result.get("output", {}).get("score", 0.0),
        }

    async def detect_pose(self, image_url: str) -> Dict[str, Any]:
        """Detect pose in image."""
        input_params = {"image_url": image_url}
        
        result = await self.submit(
            model_name="fal-ai/yolo-pose",
            input_params=input_params,
        )
        
        return {
            "pose_keypoints": result.get("output", {}).get("keypoints"),
            "pose_map_url": result.get("output", {}).get("pose_map_url"),
        }

    async def wait_for_completion(self, request_id: str, max_wait: int = 300) -> Dict[str, Any]:
        """Wait for job completion (polling)."""
        import asyncio
        
        for _ in range(max_wait):
            result = await self.get_result(request_id)
            status = result.get("status")
            
            if status == "COMPLETED":
                return result
            elif status in ("FAILED", "CANCELLED"):
                return {"error": f"Job {status.lower()}", "output": result.get("output")}
            
            await asyncio.sleep(2)
        
        return {"error": "Timeout waiting for completion"}


class FalClient(FalService):
    """Alias for backwards compatibility."""
    pass
