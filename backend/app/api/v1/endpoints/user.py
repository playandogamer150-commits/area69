from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.models.database import FaceSwapTask, Generation, LoRAModel, VideoTask, get_db, User

router = APIRouter(prefix="/user", tags=["User"])

def map_status(status: str) -> str:
    if not status:
        return "pending"
    status_lower = status.lower()
    if status_lower == "succeeded":
        return "ready"
    if status_lower in ("starting", "processing"):
        return "training"
    return status_lower


async def sync_lora_status(lora: LoRAModel, db: Session) -> None:
    if lora.status in ("succeeded", "ready", "failed", "canceled"):
        return
    if not lora.replicate_prediction_id:
        return

    from app.services.replicate_service import ReplicateService

    rep_svc = ReplicateService()
    try:
        training = await rep_svc.get_training(lora.replicate_prediction_id)
        new_status = training.get("status")
        if not new_status:
            return

        if new_status == "succeeded":
            destination = lora.fal_lora_url or training.get("destination")
            version_ref = destination
            if destination and "/" in destination:
                owner, name = destination.split("/", 1)
                model = await rep_svc.get_model(owner, name)
                latest_version = (model.get("latest_version") or {}).get("id")
                if latest_version:
                    version_ref = f"{destination}:{latest_version}"
            lora.status = "ready"
            lora.fal_lora_url = version_ref
            lora.progress = 100
        else:
            lora.status = new_status

        db.commit()
    except Exception as e:
        import logging

        logging.error(f"Error polling replicate for lora {lora.id}: {e}")

@router.get("/loras")
async def get_user_loras(userId: str = Query(...), db: Session = Depends(get_db)):
    user = resolve_user(userId, db)
    if not user:
        return []
    
    loras = db.query(LoRAModel).filter(LoRAModel.user_id == user.id).order_by(LoRAModel.created_at.desc()).all()
    
    for lora in loras:
        await sync_lora_status(lora, db)

    # We return the mapped statuses, excluding failed (simulated/test ones)
    return [
        {
            "loraId": str(lora.id),
            "modelName": lora.model_name,
            "status": map_status(lora.status),
            "progress": lora.progress,
            "falLoraUrl": lora.fal_lora_url,
            "triggerWord": lora.trigger_word,
            "enableNsfw": lora.enable_nsfw,
            "createdAt": lora.created_at.isoformat() if lora.created_at else "",
            "updatedAt": lora.updated_at.isoformat() if lora.updated_at else "",
        }
        for lora in loras
        if lora.status != "failed"  # Exclude failed/simulated LoRAs
    ]

@router.get("/loras/{lora_id}")
async def get_lora_status(lora_id: str, db: Session = Depends(get_db)):
    lora = db.query(LoRAModel).filter(LoRAModel.id == int(lora_id)).first()
    if not lora:
        return {}
        
    await sync_lora_status(lora, db)

    return {
        "loraId": str(lora.id),
        "modelName": lora.model_name,
        "status": map_status(lora.status),
        "progress": lora.progress,
        "falLoraUrl": lora.fal_lora_url,
        "triggerWord": lora.trigger_word,
        "enableNsfw": lora.enable_nsfw,
        "createdAt": lora.created_at.isoformat() if lora.created_at else "",
        "updatedAt": lora.updated_at.isoformat() if lora.updated_at else "",
    }


@router.get("/stats")
async def get_user_stats(userId: str = Query(...), db: Session = Depends(get_db)):
    user = resolve_user(userId, db)
    if not user:
        return {
            "identities": 0,
            "imagesToday": 0,
            "generatedImagesToday": 0,
            "editedImagesToday": 0,
            "faceSwapsToday": 0,
            "videosToday": 0,
            "recentActivity": [],
        }

    today = datetime.now(timezone.utc).date()

    loras = db.query(LoRAModel).filter(LoRAModel.user_id == user.id).all()
    for lora in loras:
        await sync_lora_status(lora, db)

    ready_loras = [lora for lora in loras if map_status(lora.status) == "ready"]

    generations = db.query(Generation).filter(Generation.user_id == user.id).all()
    face_swaps = db.query(FaceSwapTask).filter(FaceSwapTask.user_id == user.id).all()
    videos = db.query(VideoTask).filter(VideoTask.user_id == user.id).all()

    images_today = [
        generation for generation in generations
        if generation.created_at and generation.created_at.date() == today and generation.task_type in ("image", "image_edit")
    ]
    generated_images_today = [
        generation for generation in generations
        if generation.created_at and generation.created_at.date() == today and generation.task_type == "image"
    ]
    edited_images_today = [
        generation for generation in generations
        if generation.created_at and generation.created_at.date() == today and generation.task_type == "image_edit"
    ]
    face_swaps_today = [task for task in face_swaps if task.created_at and task.created_at.date() == today]
    videos_today = [task for task in videos if task.created_at and task.created_at.date() == today]

    recent_activity = []

    for lora in sorted(loras, key=lambda item: item.created_at or datetime.min, reverse=True)[:5]:
        recent_activity.append({
            "id": f"lora-{lora.id}",
            "type": "identity",
            "title": lora.model_name,
            "status": map_status(lora.status),
            "createdAt": lora.created_at.isoformat() if lora.created_at else "",
        })

    for generation in sorted(generations, key=lambda item: item.created_at or datetime.min, reverse=True)[:8]:
        recent_activity.append({
            "id": f"generation-{generation.id}",
            "type": generation.task_type or "image",
            "title": generation.prompt[:80] if generation.prompt else "Geracao",
            "status": generation.status,
            "createdAt": generation.created_at.isoformat() if generation.created_at else "",
            "imageUrl": generation.output_url,
        })

    recent_activity.sort(key=lambda item: item.get("createdAt", ""), reverse=True)

    return {
        "identities": len(ready_loras),
        "imagesToday": len(images_today),
        "generatedImagesToday": len(generated_images_today),
        "editedImagesToday": len(edited_images_today),
        "faceSwapsToday": len(face_swaps_today),
        "videosToday": len(videos_today),
        "recentActivity": recent_activity[:10],
    }
def resolve_user(user_id_value: str, db: Session) -> User | None:
    user = None
    try:
        user = db.query(User).filter(User.id == int(user_id_value)).first()
    except (TypeError, ValueError):
        user = None
    if user:
        return user
    if "@" in user_id_value:
        user = db.query(User).filter(User.email == user_id_value).first()
        if user:
            return user
    email = f"user_{user_id_value}@example.com"
    return db.query(User).filter(User.email == email).first()
