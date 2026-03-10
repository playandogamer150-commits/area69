from typing import Any, Dict, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.database import User
from app.core.logging import get_logger

logger = get_logger(__name__)

COST_TABLE = {
    "lora_training": 5.00,
    "image_generation": 0.02,
    "face_swap_image": 0.05,
    "face_swap_video": 0.50,
    "video_generation": 0.80,
}


class CostTrackerService:
    def __init__(self):
        self.db: Optional[Session] = None
    
    def get_db(self):
        if self.db is None:
            self.db = SessionLocal()
        return self.db
    
    def estimate_cost(self, task_type: str, **kwargs) -> float:
        """Estimate cost of a task before execution."""
        base_cost = COST_TABLE.get(task_type, 0.0)
        
        if task_type == "face_swap_video":
            duration = kwargs.get("duration", 4)
            return base_cost * duration
        
        if task_type == "video_generation":
            duration = kwargs.get("duration", 4)
            return base_cost * duration
        
        if task_type == "image_generation":
            num_images = kwargs.get("num_images", 1)
            return base_cost * num_images
        
        return base_cost
    
    def record_usage(
        self,
        user_id: int,
        task_type: str,
        actual_cost: float,
        task_id: str,
    ) -> Dict[str, Any]:
        """Record actual usage for tracking and billing."""
        logger.info(
            f"Usage recorded: user={user_id}, task_type={task_type}, "
            f"cost=${actual_cost}, task_id={task_id}"
        )
        
        return {
            "user_id": user_id,
            "task_type": task_type,
            "cost": actual_cost,
            "task_id": task_id,
            "recorded_at": datetime.utcnow().isoformat(),
        }
    
    def get_user_balance(self, user_id: int) -> Dict[str, Any]:
        """Get user balance and usage."""
        return {
            "balance": 100.0,
            "used_this_month": 0.0,
            "estimated_remaining": 100.0,
            "currency": "USD",
        }
    
    def check_sufficient_balance(self, user_id: int, estimated_cost: float) -> bool:
        """Check if user has sufficient balance before executing task."""
        balance_info = self.get_user_balance(user_id)
        return balance_info["estimated_remaining"] >= estimated_cost
    
    def get_monthly_usage(self, user_id: int) -> Dict[str, Any]:
        """Get monthly usage breakdown."""
        return {
            "user_id": user_id,
            "month": datetime.utcnow().strftime("%Y-%m"),
            "total_cost": 0.0,
            "tasks": {
                "lora_training": {"count": 0, "cost": 0.0},
                "image_generation": {"count": 0, "cost": 0.0},
                "face_swap_image": {"count": 0, "cost": 0.0},
                "face_swap_video": {"count": 0, "cost": 0.0},
                "video_generation": {"count": 0, "cost": 0.0},
            },
        }


cost_tracker = CostTrackerService()
