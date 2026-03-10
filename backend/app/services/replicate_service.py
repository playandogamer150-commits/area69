from __future__ import annotations

from typing import Any, Dict, List, Optional

import httpx

from app.core.config import Settings
from app.core.logging import get_logger

logger = get_logger(__name__)
settings = Settings()


class ReplicateService:
    def __init__(self, token: str | None = None) -> None:
        self.token = token or settings.REPLICATE_API_TOKEN
        self.base_url = "https://api.replicate.com/v1"
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=120.0)
    
    async def _request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        headers = kwargs.pop("headers", {})
        headers["Authorization"] = f"Token {self.token}"
        headers["Content-Type"] = "application/json"
        
        resp = await self.client.request(method, endpoint, headers=headers, **kwargs)
        if resp.status_code in (200, 201):
            return resp.json()
        
        error_msg = f"Replicate API error: {resp.status_code} - {resp.text}"
        logger.error(error_msg)
        return {"error": error_msg, "status_code": resp.status_code}

    async def create_prediction(
        self,
        model_version: str,
        input_params: Dict[str, Any],
        webhook_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create a new prediction (async task)."""
        body = {
            "version": model_version,
            "input": input_params,
        }
        if webhook_url:
            body["webhook"] = webhook_url
            
        return await self._request("POST", "/predictions", json=body)

    async def create_model(
        self,
        owner: str,
        name: str,
        description: str,
        visibility: str = "private",
        hardware: str = "gpu-l40s",
    ) -> Dict[str, Any]:
        body = {
            "owner": owner,
            "name": name,
            "description": description,
            "visibility": visibility,
            "hardware": hardware,
        }
        return await self._request("POST", "/models", json=body)

    async def get_model(self, owner: str, name: str) -> Dict[str, Any]:
        return await self._request("GET", f"/models/{owner}/{name}")

    async def create_training(
        self,
        trainer_owner: str,
        trainer_name: str,
        trainer_version: str,
        destination: str,
        input_params: Dict[str, Any],
    ) -> Dict[str, Any]:
        body = {
            "destination": destination,
            "input": input_params,
        }
        return await self._request(
            "POST",
            f"/models/{trainer_owner}/{trainer_name}/versions/{trainer_version}/trainings",
            json=body,
        )

    async def get_training(self, training_id: str) -> Dict[str, Any]:
        return await self._request("GET", f"/trainings/{training_id}")

    async def get_prediction(self, prediction_id: str) -> Dict[str, Any]:
        """Get prediction status and output."""
        return await self._request("GET", f"/predictions/{prediction_id}")

    async def cancel_prediction(self, prediction_id: str) -> Dict[str, Any]:
        """Cancel a running prediction."""
        return await self._request("POST", f"/predictions/{prediction_id}/cancel")

    async def train_lora(
        self,
        training_data_url: str,
        trigger_word: str,
        destination: str,
        steps: int = 1000,
        lora_type: str = "subject",
    ) -> Dict[str, Any]:
        """Train a FLUX fine-tune on Replicate."""
        input_params = {
            "input_images": training_data_url,
            "trigger_word": trigger_word,
            "lora_type": lora_type,
            "training_steps": steps,
        }

        return await self.create_training(
            trainer_owner="ostris",
            trainer_name="flux-dev-lora-trainer",
            trainer_version="26dce37af90b9d997eeb970d92e47de3064d46c300504ae376c75bef6a9022d2",
            destination=destination,
            input_params=input_params,
        )

    async def generate_image(
        self,
        prompt: str,
        negative_prompt: str = "",
        lora_url: Optional[str] = None,
        lora_strength: float = 0.8,
        width: int = 1024,
        height: int = 1024,
        steps: int = 30,
        guidance_scale: float = 7.0,
        seed: Optional[int] = None,
        enable_nsfw: bool = True,
    ) -> Dict[str, Any]:
        """Generate image, preferring a published fine-tuned model."""
        logger.info(
            "[Replicate] generate_image called: prompt='%s...', lora_url=%s, strength=%s",
            prompt[:50],
            lora_url,
            lora_strength,
        )

        if lora_url and ":" in lora_url and "/" in lora_url.split(":", 1)[0]:
            _, version_id = lora_url.rsplit(":", 1)
            input_params = {
                "prompt": prompt,
                "aspect_ratio": self._aspect_ratio(width, height),
                "num_outputs": 1,
                "output_format": "png",
                "output_quality": 100,
                "guidance_scale": guidance_scale,
                "prompt_strength": lora_strength,
            }
            if negative_prompt:
                input_params["negative_prompt"] = negative_prompt
            if seed is not None:
                input_params["seed"] = seed

            logger.info(f"[Replicate] Using published fine-tuned model version: {version_id}")
            logger.info(f"[Replicate] Final input_params: {input_params}")
            return await self.create_prediction(version_id, input_params)

        input_params = {
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "width": width,
            "height": height,
            "num_inference_steps": steps,
            "guidance_scale": guidance_scale,
        }

        if lora_url and lora_url.startswith(("http://", "https://")):
            input_params["loras"] = [{"path": lora_url, "scale": lora_strength}]
            logger.info(f"[Replicate] Using direct LoRA file URL fallback: {lora_url}")

        if seed is not None:
            input_params["seed"] = seed

        logger.info(f"[Replicate] Final fallback input_params: {input_params}")
        return await self.create_prediction(
            model_version="db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
            input_params=input_params,
        )

    def _aspect_ratio(self, width: int, height: int) -> str:
        if width == height:
            return "1:1"
        if width > height:
            return "16:9" if width / max(height, 1) > 1.5 else "3:2"
        return "9:16" if height / max(width, 1) > 1.5 else "2:3"

    async def face_swap_image(
        self,
        source_image_url: str,
        target_image_url: str,
        swap_strength: float = 0.8,
    ) -> Dict[str, Any]:
        """Face swap on static image."""
        input_params = {
            "source_image": source_image_url,
            "target_image": target_image_url,
            "swap_strength": swap_strength,
        }
        
        return await self.create_prediction(
            model_version="face-swap-model-version",
            input_params=input_params,
        )

    async def face_swap_video(
        self,
        source_video_url: str,
        target_image_url: str,
        strength: float = 0.8,
    ) -> Dict[str, Any]:
        """Face swap on video."""
        input_params = {
            "source_video": source_video_url,
            "target_face": target_image_url,
            "strength": strength,
        }
        
        return await self.create_prediction(
            model_version="wan-video/wan-2.2-animate-replace:latest",
            input_params=input_params,
        )

    async def generate_video_motion(
        self,
        image_prompt: str,
        motion_strength: float = 0.7,
        duration: int = 4,
    ) -> Dict[str, Any]:
        """Generate animated video from image."""
        input_params = {
            "image": image_prompt,
            "motion_strength": motion_strength,
            "duration": duration,
        }
        
        return await self.create_prediction(
            model_version="wan-video/wan-2.2-animate-14b:latest",
            input_params=input_params,
        )

    async def generate_video_directly(
        self,
        audio_url: str,
        image_reference: str,
    ) -> Dict[str, Any]:
        """Generate video from audio + image reference."""
        input_params = {
            "audio": audio_url,
            "image": image_reference,
        }
        
        return await self.create_prediction(
            model_version="wan-video/wan-2.2-s2v:latest",
            input_params=input_params,
        )

    async def detect_pose(self, image_url: str) -> Dict[str, Any]:
        """Detect pose in image."""
        input_params = {"image": image_url}
        
        return await self.create_prediction(
            model_version="hautechai/yolo11x-pose:latest",
            input_params=input_params,
        )


class ReplicateClient(ReplicateService):
    """Alias for backwards compatibility."""
    pass
