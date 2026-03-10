from __future__ import annotations

import logging
import re
import uuid
from datetime import datetime

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models.database import Generation, LoRAModel, User, get_db
from app.models.schemas import (
    FaceSwapRequest,
    FaceSwapResponse,
    FaceSwapVideoRequest,
    FaceSwapVideoResponse,
    GenerationRequest,
    GenerationResponse,
    ImageEditRequest,
    ImageEditResponse,
    ImageFaceswapRequest,
    ImageFaceswapResponse,
    VideoDirectRequest,
    VideoDirectResponse,
    VideoMotionRequest,
    VideoMotionResponse,
)
from app.services.fal_service import FalService
from app.services.replicate_service import ReplicateService
from app.services.r2_storage import R2Storage
from app.services.wavespeed_service import WaveSpeedService
from app.core.security import get_current_licensed_user

logger = logging.getLogger(__name__)
router = APIRouter()


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def ensure_trigger_word(prompt: str, trigger_word: str) -> str:
    if not trigger_word:
        return prompt.strip()
    if re.search(rf"\b{re.escape(trigger_word)}\b", prompt, re.IGNORECASE):
        return prompt.strip()
    return f"{trigger_word}, {prompt.strip()}".strip(", ")


def pose_phrase(pose: str) -> str:
    mapping = {
        "standing": "standing pose, full body balance, natural posture",
        "sitting": "seated pose, relaxed legs, natural body alignment",
        "lying": "lying down pose, reclining composition, natural body placement",
        "kneeling": "kneeling pose, grounded posture, realistic body positioning",
        "custom": "custom pose, realistic anatomy, physically plausible pose",
    }
    return mapping.get((pose or "").lower(), "natural pose, realistic anatomy")


def makeup_phrase(makeup: float) -> str:
    if makeup < 0.2:
        return "barely any makeup, natural skin texture, fresh face"
    if makeup < 0.45:
        return "light makeup, soft blush, subtle lipstick"
    if makeup < 0.75:
        return "refined glam makeup, defined eyes, flattering lipstick"
    return "dramatic glam makeup, defined eyeliner, polished beauty look"


def nsfw_phrase(strength: float) -> str:
    if strength < 0.2:
        return "fully clothed adult glamour photography, sensual but non-explicit"
    if strength < 0.45:
        return "sensual adult glamour, revealing outfit, seductive styling"
    if strength < 0.7:
        return "erotic adult glamour photography, lingerie or revealing styling"
    if strength < 0.9:
        return "explicit adult NSFW photography, nude composition, erotic realism"
    return "highly explicit adult NSFW photography, nude body emphasis, erotic realism"


def cum_effect_phrase(cum_effect: float) -> str:
    if cum_effect < 0.2:
        return "clean composition, no fluid effects"
    if cum_effect < 0.45:
        return "slight glossy skin highlights, wet look details"
    if cum_effect < 0.75:
        return "visible wet skin details, glossy erotic finish"
    return "explicit fluid details, glossy wet erotic finish"


def feminine_phrase(girl_lora_strength: float | None) -> str:
    value = 0.8 if girl_lora_strength is None else girl_lora_strength
    if value < 0.35:
        return "adult woman, restrained feminine styling"
    if value < 0.7:
        return "adult woman, balanced feminine facial features"
    return "adult woman, feminine facial features, soft curves, elegant beauty"


def build_prompt(request: GenerationRequest, trigger_word: str) -> str:
    base_prompt = ensure_trigger_word(request.prompt, trigger_word)
    realism_parts = [
        "ultra realistic photography",
        "photorealistic skin texture",
        "detailed face",
        "high facial likeness",
        "cinematic lighting",
        "sharp focus",
    ]
    control_parts = [
        pose_phrase(request.pose),
        makeup_phrase(request.makeup),
        nsfw_phrase(request.strength),
        cum_effect_phrase(request.cumEffect),
        feminine_phrase(request.girlLoraStrength),
    ]
    return ", ".join([base_prompt, *realism_parts, *control_parts])


def build_negative_prompt(negative_prompt: str, strength: float) -> str:
    defaults = [
        "low quality",
        "blurry",
        "deformed anatomy",
        "bad hands",
        "extra fingers",
        "cross-eyed",
        "mutated face",
        "plastic skin",
        "cartoon",
        "illustration",
        "painting",
        "3d render",
        "censored",
        "mosaic",
        "watermark",
        "text",
    ]
    if strength > 0.5:
        defaults.extend(["clothes when nude is intended", "covered body when explicit pose is intended"])
    if negative_prompt.strip():
        defaults.insert(0, negative_prompt.strip())
    return ", ".join(defaults)


def tuned_guidance_scale(request: GenerationRequest) -> float:
    base = 3.2 + (request.makeup * 0.4) + (request.strength * 0.6)
    return round(clamp(base, 3.0, 4.8), 2)


def tuned_prompt_strength(request: GenerationRequest) -> float:
    base = 0.72 + (request.loraStrength * 0.2) + ((request.girlLoraStrength or 0.8) * 0.08)
    return round(clamp(base, 0.7, 0.98), 2)


def get_or_create_user_id(user_id_value: str, db: Session) -> int:
    user = None
    email = f"user_{user_id_value}@example.com"
    try:
        user = db.query(User).filter(User.id == int(user_id_value)).first()
    except (TypeError, ValueError):
        user = None
    if not user and "@" in user_id_value:
        user = db.query(User).filter(User.email == user_id_value).first()
    if not user:
        email = f"user_{user_id_value}@example.com"
        user = db.query(User).filter(User.email == email).first()
    if user:
        return user.id

    try:
        numeric_id = int(user_id_value)
        existing = db.query(User).filter(User.id == numeric_id).first()
        if existing:
            max_user = db.query(User).order_by(User.id.desc()).first()
            numeric_id = (max_user.id + 1) if max_user else 1
        user = User(id=numeric_id, email=email, hashed_password="", name=user_id_value)
    except ValueError:
        max_user = db.query(User).order_by(User.id.desc()).first()
        new_id = (max_user.id + 1) if max_user else 1
        user = User(id=new_id, email=email, hashed_password="", name=user_id_value)

    db.add(user)
    db.commit()
    db.refresh(user)
    return user.id


async def persist_remote_image_to_r2(image_url: str, storage_key: str) -> str:
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.get(image_url)
        response.raise_for_status()
        content_type = response.headers.get("content-type", "image/png")
        r2 = R2Storage()
        upload_result = r2.upload_file(
            file_content=response.content,
            file_name=storage_key,
            content_type=content_type,
            is_public=True,
        )
        if not upload_result.get("ok"):
            raise RuntimeError(upload_result.get("error", "R2 upload failed"))
        return upload_result["file_url"]


@router.post("/generate/image", response_model=GenerationResponse)
async def generate_image(
    request: GenerationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_licensed_user),
):
    """Generate image with NSFW granular controls."""
    lora = db.query(LoRAModel).filter(
        LoRAModel.model_name == request.loraName
    ).order_by(LoRAModel.created_at.desc()).first()
    
    if not lora:
        raise HTTPException(status_code=404, detail="LoRA not found")
    
    if lora.status != "ready":
        raise HTTPException(
            status_code=400,
            detail=f"LoRA is not ready. Current status: {lora.status}"
        )
    
    replicate_service = ReplicateService()
    try:
        enhanced_prompt = build_prompt(request, lora.trigger_word)
        enhanced_negative_prompt = build_negative_prompt(request.negativePrompt, request.strength)
        final_guidance_scale = tuned_guidance_scale(request)
        final_prompt_strength = tuned_prompt_strength(request)

        logger.info(
            "[Generate] request: lora_name=%s, lora_url=%s, prompt_strength=%s, guidance=%s",
            request.loraName,
            lora.fal_lora_url,
            final_prompt_strength,
            final_guidance_scale,
        )
        logger.info("[Generate] enhanced prompt: %s", enhanced_prompt)
        result = await replicate_service.generate_image(
            prompt=enhanced_prompt,
            negative_prompt=enhanced_negative_prompt,
            lora_url=lora.fal_lora_url,
            lora_strength=final_prompt_strength,
            width=request.width,
            height=request.height,
            steps=request.steps,
            guidance_scale=final_guidance_scale,
            seed=request.seed,
        )
        logger.info(f"[Generate] replicate result: {result}")
        if result.get("error"):
            raise HTTPException(
                status_code=result.get("status_code", 500),
                detail=result["error"],
            )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        logger.error(f"[Generate] Exception: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate custom image: {str(e)}")
        
    image_url = ""
    # replicate typically returns ["url"] or a url string
    if result and "output" in result:
        output = result.get("output", [])
        if isinstance(output, list) and len(output) > 0:
            image_url = output[0]
        elif isinstance(output, str):
            image_url = output
    elif result and isinstance(result, list) and len(result) > 0:
        image_url = result[0]
    elif result and isinstance(result, str):
        image_url = result
    
    task_id = result.get("id") if result and result.get("id") else f"gen_{uuid.uuid4().hex[:12]}"
    
    db_generation = Generation(
        user_id=lora.user_id,
        task_id=task_id,
        task_type="image",
        prompt=request.prompt,
        negative_prompt=request.negativePrompt,
        lora_id=lora.id,
        cum_effect=request.cumEffect,
        makeup=request.makeup,
        pose=request.pose,
        strength=request.strength,
        lora_strength=request.loraStrength,
        girl_lora_strength=request.girlLoraStrength,
        width=request.width,
        height=request.height,
        steps=request.steps,
        guidance_scale=request.guidanceScale,
        seed=request.seed,
        output_url=image_url,
        status="completed" if image_url else "processing",
        progress=100 if image_url else 50,
    )
    db.add(db_generation)
    db.commit()
    
    return GenerationResponse(
        ok=True,
        taskId=task_id,
        status=db_generation.status,
        imageUrl=image_url,
        message="Image generation completed" if image_url else "Processing",
    )


@router.get("/generate/status/{task_id}", response_model=GenerationResponse)
async def get_generation_status(
    task_id: str,
    db: Session = Depends(get_db),
):
    """Get generation task status."""
    generation = db.query(Generation).filter(
        Generation.task_id == task_id
    ).first()
    
    if not generation:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if generation.status in ("pending", "created", "processing") and not task_id.startswith("gen_"):
        try:
            if generation.task_type == "image_edit":
                wave_svc = WaveSpeedService()
                prediction = await wave_svc.get_result(task_id)
                new_status = prediction.get("status")
                if new_status == "completed":
                    outputs = prediction.get("outputs", [])
                    if outputs:
                        storage_key = f"generated/image-edits/{generation.user_id}/{task_id}.png"
                        generation.output_url = await persist_remote_image_to_r2(outputs[0], storage_key)
                    generation.status = "completed"
                    generation.progress = 100
                    db.commit()
                elif new_status == "failed":
                    generation.status = "failed"
                    generation.error_message = prediction.get("error")
                    db.commit()
            else:
                rep_svc = ReplicateService()
                prediction = await rep_svc.get_prediction(task_id)
                new_status = prediction.get("status")
                if new_status in ("succeeded", "failed", "canceled"):
                    if new_status == "succeeded":
                        output = prediction.get("output", [])
                        if isinstance(output, list) and len(output) > 0:
                            generation.output_url = output[0]
                        elif isinstance(output, str):
                            generation.output_url = output
                        generation.status = "completed"
                        generation.progress = 100
                    else:
                        generation.status = "failed"
                        generation.error_message = prediction.get("error")
                    db.commit()
        except Exception as e:
            import logging
            logging.error(f"Error polling generation task {task_id}: {e}")
    
    return GenerationResponse(
        ok=True,
        taskId=generation.task_id,
        status=generation.status,
        imageUrl=generation.output_url,
        progress=generation.progress,
    )


@router.post("/generate/image-edit", response_model=ImageEditResponse)
async def generate_image_edit(
    request: ImageEditRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_licensed_user),
):
    wave_svc = WaveSpeedService()
    if not wave_svc.api_key:
        raise HTTPException(status_code=500, detail="WaveSpeed API key nao configurada")
    if not request.images:
        raise HTTPException(status_code=400, detail="Envie ao menos uma imagem para edicao")

    uploaded_urls: list[str] = []
    async with httpx.AsyncClient(timeout=120.0) as client:
        for image_path in request.images:
            source_response = await client.get(f"http://backend:8000{image_path}")
            if source_response.status_code != 200:
                raise HTTPException(status_code=400, detail=f"Falha ao ler imagem: {image_path}")
            file_name = image_path.rsplit("/", 1)[-1]
            content_type = source_response.headers.get("content-type", "image/jpeg")
            upload_result = await wave_svc.upload_binary(source_response.content, file_name, content_type)
            if upload_result.get("error"):
                raise HTTPException(status_code=500, detail=upload_result["error"])
            download_url = upload_result.get("download_url")
            if not download_url:
                raise HTTPException(status_code=500, detail=f"WaveSpeed upload sem download_url: {upload_result}")
            uploaded_urls.append(download_url)

    result = await wave_svc.submit_image_edit(
        images=uploaded_urls,
        prompt=request.prompt,
        size=request.size,
        seed=request.seed,
    )
    logger.info("[ImageEdit] WaveSpeed submit result: %s", result)
    if result.get("error"):
        raise HTTPException(status_code=result.get("status_code", 500), detail=result["error"])

    user_id = get_or_create_user_id(request.userId, db)
    task_id = result.get("id") or result.get("taskId") or result.get("request_id") or f"edit_{uuid.uuid4().hex[:12]}"
    generation = Generation(
        user_id=user_id,
        task_id=task_id,
        task_type="image_edit",
        prompt=request.prompt,
        negative_prompt="",
        output_url="",
        status="processing" if result.get("status") in ("pending", "created", "processing") else result.get("status", "processing"),
        progress=25,
    )
    db.add(generation)
    db.commit()

    return ImageEditResponse(
        ok=True,
        taskId=task_id,
        status=generation.status,
        imageUrl=None,
        message="Edicao iniciada",
    )


@router.post("/generate/face-swap", response_model=FaceSwapResponse)
async def face_swap_image(
    request: FaceSwapRequest,
    db: Session = Depends(get_db),
):
    """Face swap on static image."""
    replicate_service = ReplicateService()
    result = await replicate_service.face_swap_image(
        source_image_url=request.source_image_url,
        target_image_url=request.target_image_url,
        swap_strength=request.lora_strength,
    )
    
    return FaceSwapResponse(
        ok=True,
        output_url=result.get("output"),
        message="Face swap completed",
    )


@router.post("/generate/face-swap-video", response_model=FaceSwapVideoResponse)
async def face_swap_video(
    request: FaceSwapVideoRequest,
    db: Session = Depends(get_db),
):
    """Face swap on video."""
    replicate_service = ReplicateService()
    result = await replicate_service.face_swap_video(
        source_video_url=request.source_video_url,
        target_image_url=request.target_image_url,
        strength=request.lora_strength,
    )
    
    return FaceSwapVideoResponse(
        ok=True,
        output_video_url=result.get("output"),
        message="Video face swap completed",
    )


@router.post("/generate/image-faceswap", response_model=ImageFaceswapResponse)
async def image_faceswap(
    request: ImageFaceswapRequest,
    db: Session = Depends(get_db),
):
    """Alternative face swap endpoint."""
    replicate_service = ReplicateService()
    result = await replicate_service.face_swap_image(
        source_image_url=request.source_url,
        target_image_url=request.dest_url,
    )
    
    return ImageFaceswapResponse(
        ok=True,
        output_url=result.get("output"),
    )


@router.post("/generate/video-motion", response_model=VideoMotionResponse)
async def generate_video_motion(
    request: VideoMotionRequest,
    db: Session = Depends(get_db),
):
    """Generate animated video from image."""
    replicate_service = ReplicateService()
    result = await replicate_service.generate_video_motion(
        image_prompt=request.image_prompt,
        motion_strength=request.lora_strength,
    )
    
    return VideoMotionResponse(
        ok=True,
        video_url=result.get("output"),
    )


@router.post("/generate/video-directly", response_model=VideoDirectResponse)
async def generate_video_directly(
    request: VideoDirectRequest,
    db: Session = Depends(get_db),
):
    """Generate video from audio + image reference."""
    replicate_service = ReplicateService()
    result = await replicate_service.generate_video_directly(
        audio_url=request.audio_file,
        image_reference=request.image_reference,
    )
    
    return VideoDirectResponse(
        ok=True,
        video_url=result.get("output"),
    )
