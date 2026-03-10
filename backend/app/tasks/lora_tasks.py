import asyncio

from celery import Task
from celery.utils.log import get_task_logger

from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.models.database import LoRAModel
from app.services.fal_service import FalService
from app.services.r2_storage import R2StorageService
from app.core.logging import get_logger

logger = get_logger(__name__)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=120)
def train_lora_task(self, lora_id: str, training_params: dict):
    """Async task for LoRA training."""
    db = next(get_db())
    
    try:
        fal_service = FalService()
        
        result = asyncio.run(fal_service.train_and_host_lora(
            reference_images=training_params["reference_images"],
            trigger_word=training_params["trigger_word"],
            enable_nsfw=training_params.get("enable_nsfw", True),
        ))
        
        lora = db.query(LoRAModel).filter(LoRAModel.id == int(lora_id)).first()
        if lora:
            lora.status = result.get("status", "training")
            lora.fal_lora_url = result.get("fal_lora_url")
            lora.progress = 100 if result.get("status") == "ready" else 50
            db.commit()
        
        return {"status": lora.status if lora else "unknown", "lora_id": lora_id}
        
    except Exception as e:
        logger.error(f"LoRA training task failed: {e}")
        
        lora = db.query(LoRAModel).filter(LoRAModel.id == int(lora_id)).first()
        if lora:
            lora.status = "failed"
            lora.error_message = str(e)
            db.commit()
        
        raise self.retry(exc=e, countdown=120 * (2 ** self.request.retries))
    
    finally:
        db.close()


@celery_app.task
def check_lora_status_task(lora_id: str):
    """Check LoRA training status."""
    db = next(get_db())
    
    try:
        lora = db.query(LoRAModel).filter(LoRAModel.id == int(lora_id)).first()
        if not lora:
            return {"status": "not_found", "lora_id": lora_id}
        
        if lora.replicate_prediction_id:
            from app.services.replicate_service import ReplicateService
            
            replicate_service = ReplicateService()
            result = asyncio.run(replicate_service.check_prediction_status(
                lora.replicate_prediction_id
            ))
            
            status = result.get("status", "unknown")
            if status == "succeeded":
                lora.status = "ready"
                lora.progress = 100
            elif status == "failed":
                lora.status = "failed"
            
            db.commit()
        
        return {"status": lora.status, "progress": lora.progress, "lora_id": lora_id}
        
    finally:
        db.close()
