from celery import Task
from celery.utils.log import get_task_logger
import httpx
import asyncio

from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.models.database import Generation, FaceSwapTask, VideoTask
from app.services.fal_service import FalService
from app.services.replicate_service import ReplicateService
from app.services.r2_storage import R2StorageService
from app.core.logging import get_logger

logger = get_logger(__name__)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class AsyncTask(Task):
    def run(self, *args, **kwargs):
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(self.async_run(*args, **kwargs))
    
    async def async_run(self, *args, **kwargs):
        raise NotImplementedError()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def generate_image_task(self, task_id: str, generation_params: dict):
    """Async task for image generation."""
    db = next(get_db())
    
    try:
        fal_service = FalService()
        r2_service = R2StorageService()
        
        result = asyncio.run(fal_service.generate_flux_nsfw(**generation_params))
        
        if result.get("image_url"):
            try:
                response = httpx.get(result["image_url"], timeout=30)
                image_content = response.content
                
                r2_result = r2_service.upload_file(
                    file_content=image_content,
                    file_name=f"generations/{task_id}.jpg",
                    content_type="image/jpeg",
                )
                
                if r2_result.get("ok"):
                    output_url = r2_result["file_url"]
                else:
                    output_url = result["image_url"]
            except Exception as e:
                logger.error(f"Failed to upload to R2: {e}")
                output_url = result.get("image_url")
        else:
            output_url = None
        
        generation = db.query(Generation).filter(Generation.task_id == task_id).first()
        if generation:
            generation.status = "completed" if output_url else "failed"
            generation.output_url = output_url
            generation.progress = 100 if output_url else 0
            db.commit()
        
        return {"status": "completed", "output_url": output_url}
        
    except Exception as e:
        logger.error(f"Image generation task failed: {e}")
        
        generation = db.query(Generation).filter(Generation.task_id == task_id).first()
        if generation:
            generation.status = "failed"
            generation.error_message = str(e)
            db.commit()
        
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
    
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def face_swap_task(self, task_id: str, source_url: str, target_url: str, lora_strength: float):
    """Async task for face swap."""
    db = next(get_db())
    
    try:
        replicate_service = ReplicateService()
        r2_service = R2StorageService()
        
        result = asyncio.run(replicate_service.face_swap_image(
            source_image_url=source_url,
            target_image_url=target_url,
            swap_strength=lora_strength,
        ))
        
        output_url = result.get("output")
        
        face_swap = db.query(FaceSwapTask).filter(FaceSwapTask.task_id == task_id).first()
        if face_swap:
            face_swap.status = "completed" if output_url else "failed"
            face_swap.output_url = output_url
            face_swap.progress = 100 if output_url else 0
            db.commit()
        
        return {"status": "completed", "output_url": output_url}
        
    except Exception as e:
        logger.error(f"Face swap task failed: {e}")
        
        face_swap = db.query(FaceSwapTask).filter(FaceSwapTask.task_id == task_id).first()
        if face_swap:
            face_swap.status = "failed"
            face_swap.error_message = str(e)
            db.commit()
        
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
    
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def video_generation_task(self, task_id: str, task_type: str, params: dict):
    """Async task for video generation."""
    db = next(get_db())
    
    try:
        replicate_service = ReplicateService()
        
        if task_type == "motion":
            result = asyncio.run(replicate_service.generate_video_motion(
                image_prompt=params["image_prompt"],
                motion_strength=params.get("motion_strength", 0.7),
            ))
        else:
            result = asyncio.run(replicate_service.generate_video_directly(
                audio_url=params["audio_url"],
                image_reference=params["image_reference"],
            ))
        
        output_url = result.get("output")
        
        video_task = db.query(VideoTask).filter(VideoTask.task_id == task_id).first()
        if video_task:
            video_task.status = "completed" if output_url else "failed"
            video_task.output_url = output_url
            video_task.progress = 100 if output_url else 0
            db.commit()
        
        return {"status": "completed", "output_url": output_url}
        
    except Exception as e:
        logger.error(f"Video generation task failed: {e}")
        
        video_task = db.query(VideoTask).filter(VideoTask.task_id == task_id).first()
        if video_task:
            video_task.status = "failed"
            video_task.error_message = str(e)
            db.commit()
        
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
    
    finally:
        db.close()
