from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.database import Generation, FaceSwapTask, VideoTask, LoRAModel

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/replicate")
async def replicate_webhook(request: Request, db: Session = Depends(get_db)):
    """Webhook handler for Replicate callbacks."""
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    
    prediction_id = payload.get("id")
    status = payload.get("status")
    output = payload.get("output")
    error = payload.get("error")
    
    generation = db.query(Generation).filter(
        Generation.task_id == prediction_id
    ).first()
    
    if generation:
        if status == "succeeded":
            output_url = output[0] if isinstance(output, list) else output
            generation.status = "completed"
            generation.output_url = output_url
            generation.progress = 100
        elif status == "failed":
            generation.status = "failed"
            generation.error_message = error
            generation.progress = 0
        
        db.commit()
    
    face_swap = db.query(FaceSwapTask).filter(
        FaceSwapTask.task_id == prediction_id
    ).first()
    
    if face_swap:
        if status == "succeeded":
            face_swap.status = "completed"
            face_swap.output_url = output
            face_swap.progress = 100
        elif status == "failed":
            face_swap.status = "failed"
            face_swap.error_message = error
        
        db.commit()
    
    video_task = db.query(VideoTask).filter(
        VideoTask.task_id == prediction_id
    ).first()
    
    if video_task:
        if status == "succeeded":
            video_task.status = "completed"
            video_task.output_url = output
            video_task.progress = 100
        elif status == "failed":
            video_task.status = "failed"
            video_task.error_message = error
        
        db.commit()
    
    return {"status": "ok", "prediction_id": prediction_id}


@router.post("/fal")
async def fal_webhook(request: Request, db: Session = Depends(get_db)):
    """Webhook handler for Fal.ai callbacks."""
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    
    request_id = payload.get("request_id")
    status = payload.get("status")
    output = payload.get("output")
    
    lora = db.query(LoRAModel).filter(
        LoRAModel.id == int(request_id.split("_")[-1]) if request_id else None
    ).first() if request_id else None
    
    if lora and status == "COMPLETED":
        lora.status = "ready"
        lora.progress = 100
        if output and isinstance(output, dict):
            lora.fal_lora_url = output.get("lora_url")
        db.commit()
    
    return {"status": "ok", "request_id": request_id}


@router.get("/health")
async def webhook_health():
    """Health check for webhooks."""
    return {"status": "healthy"}
