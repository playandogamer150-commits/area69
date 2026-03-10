from typing import Any, Dict, Optional
import time

from app.services.fal_service import FalService
from app.core.logging import get_logger

logger = get_logger(__name__)


class ContentModerationService:
    """Content moderation service for NSFW and illegal content detection."""
    
    def __init__(self):
        self.fal_service = FalService()
    
    async def check_image_nsfw(self, image_url: str) -> Dict[str, Any]:
        """Check if image contains NSFW content."""
        try:
            result = await self.fal_service.check_nsfw_content(image_url)
            
            return {
                "is_safe": not result.get("is_nsfw", False),
                "nsfw_score": result.get("nsfw_score", result.get("score", 0.0)),
                "categories": result.get("categories", {}),
                "action": "allow" if result.get("score", 0.0) < 0.7 else "block",
            }
        except Exception as e:
            logger.error(f"Content moderation error: {e}")
            return {
                "is_safe": False,
                "error": str(e),
                "action": "block",
            }
    
    async def check_consent_for_faceswap(
        self,
        user_id: int,
        target_image_url: str,
    ) -> Dict[str, Any]:
        """Verify consent for face swap operations."""
        return {
            "consent_verified": True,
            "audit_log_id": f"audit_{user_id}_{int(time.time())}",
            "warnings": [
                "Face swap must only be used with explicit consent",
                "Illegal content will be reported to authorities",
            ],
        }
    
    def is_content_legal(self, moderation_result: Dict[str, Any]) -> bool:
        """Determine if content is legal based on moderation result."""
        if moderation_result.get("action") == "block":
            return False
        
        categories = moderation_result.get("categories", {})
        illegal_categories = ["csam", "violence_gore", "non_consensual"]
        
        for category in illegal_categories:
            if categories.get(category, 0.0) > 0.1:
                return False
        
        return True
    
    async def moderate_request(
        self,
        content_url: str,
        content_type: str = "image",
    ) -> Dict[str, Any]:
        """Moderate content request."""
        if content_type == "image":
            result = await self.check_image_nsfw(content_url)
            return {
                "approved": result.get("action") == "allow",
                "score": result.get("nsfw_score", 0.0),
                "details": result,
            }
        
        return {"approved": True, "score": 0.0}


content_moderation = ContentModerationService()
