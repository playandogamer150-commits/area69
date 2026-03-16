from __future__ import annotations

import logging
import re
import uuid
from datetime import datetime

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import ValidationError
from sqlalchemy import or_
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
from app.core.config import settings
from app.services.higgsfield_service import HiggsfieldService
from app.services.replicate_service import ReplicateService
from app.services.r2_storage import R2Storage
from app.services.wavespeed_service import WaveSpeedService
from app.core.security import get_current_licensed_user

logger = logging.getLogger(__name__)
router = APIRouter()

VALID_ASPECT_RATIOS = {"9:16", "16:9", "4:3", "3:4", "1:1", "2:3", "3:2"}
VALID_RESOLUTIONS = {"720p", "1080p"}
VALID_RESULT_IMAGES = {1, 4}


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def ensure_trigger_word(prompt: str, trigger_word: str) -> str:
    if not trigger_word:
        return prompt.strip()
    if re.search(rf"\b{re.escape(trigger_word)}\b", prompt, re.IGNORECASE):
        return prompt.strip()
    return f"{trigger_word}, {prompt.strip()}".strip(", ")


def build_prompt(request: GenerationRequest, trigger_word: str) -> str:
    base_prompt = ensure_trigger_word(request.prompt, trigger_word)
    realism_parts = [
        "ultra realistic photography",
        "flawless clarity",
        "natural light",
        "visible pores",
        "fabric details",
        "premium commercial realism",
        "sharp focus",
    ]
    return ", ".join([base_prompt, *realism_parts])


def build_soul_character_prompt(request: GenerationRequest) -> str:
    # Soul Character already receives the trained character plus prompt enhancement
    # on the provider side, so injecting the old LoRA trigger word hurts identity fidelity.
    return request.prompt.strip()


def is_soul_identity(lora: LoRAModel) -> bool:
    return bool(lora.fal_lora_url and lora.fal_lora_url.startswith("soul-id:"))


def extract_soul_id(lora: LoRAModel) -> str:
    if not is_soul_identity(lora):
        raise HTTPException(status_code=400, detail="Identidade Soul ID invalida")
    return lora.fal_lora_url.split(":", 1)[1]


def validated_aspect_ratio(value: str) -> str:
    if value not in VALID_ASPECT_RATIOS:
        raise HTTPException(status_code=400, detail="Aspect ratio invalido para Soul Character")
    return value


def validated_resolution(value: str) -> str:
    if value not in VALID_RESOLUTIONS:
        raise HTTPException(status_code=400, detail="Resolution invalida para Soul Character")
    return value


def validated_result_images(value: int) -> int:
    if value not in VALID_RESULT_IMAGES:
        raise HTTPException(status_code=400, detail="Result images deve ser 1 ou 4")
    return value


def aspect_ratio_dimensions(aspect_ratio: str, resolution: str) -> tuple[int, int]:
    # Match the Soul Character playground sizing as closely as possible.
    dimensions_map = {
        "1080p": {
            "9:16": (1152, 2048),
            "16:9": (2048, 1152),
            "4:3": (1536, 1152),
            "3:4": (1152, 1536),
            "1:1": (1536, 1536),
            "2:3": (1152, 1728),
            "3:2": (1728, 1152),
        },
        "720p": {
            "9:16": (768, 1365),
            "16:9": (1365, 768),
            "4:3": (1024, 768),
            "3:4": (768, 1024),
            "1:1": (1024, 1024),
            "2:3": (768, 1152),
            "3:2": (1152, 768),
        },
    }

    return dimensions_map.get(resolution, dimensions_map["1080p"]).get(
        aspect_ratio,
        dimensions_map["1080p"]["9:16"],
    )



def ensure_task_belongs_to_user(entity_user_id: int, current_user: User) -> None:
    if entity_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Resource does not belong to the current user")


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
    raw_request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_licensed_user),
):
    """Generate image with Soul Character defaults."""
    raw_payload = await raw_request.json()
    logger.info("[Generate] raw payload received: %s", raw_payload)

    try:
        request = GenerationRequest.model_validate(raw_payload)
    except ValidationError as exc:
        logger.error("[Generate] validation error: %s", exc.errors())
        raise HTTPException(status_code=400, detail=exc.errors())

    logger.info(
        "[Generate] request payload: loraName=%s characterId=%s aspectRatio=%s resolution=%s resultImages=%s references=%s",
        request.loraName,
        request.characterId,
        request.aspectRatio,
        request.resolution,
        request.resultImages,
        len(request.referenceImageUrls),
    )
    if request.characterId:
        lora = (
            db.query(LoRAModel)
            .filter(
                LoRAModel.user_id == current_user.id,
                or_(
                    LoRAModel.fal_lora_url == f"soul-id:{request.characterId}",
                    LoRAModel.fal_lora_url == request.characterId,
                ),
            )
            .order_by(LoRAModel.created_at.desc())
            .first()
        )
    else:
        lora = (
            db.query(LoRAModel)
            .filter(
                LoRAModel.user_id == current_user.id,
                LoRAModel.model_name == request.loraName,
            )
            .order_by(LoRAModel.created_at.desc())
            .first()
        )
    
    if not lora:
        raise HTTPException(status_code=404, detail="LoRA not found")
    ensure_task_belongs_to_user(lora.user_id, current_user)
    
    if lora.status != "ready":
        raise HTTPException(
            status_code=400,
            detail=f"LoRA is not ready. Current status: {lora.status}"
        )
    
    try:
        enhanced_prompt = build_soul_character_prompt(request) if is_soul_identity(lora) else build_prompt(request, lora.trigger_word)
        aspect_ratio = validated_aspect_ratio(request.aspectRatio)
        resolution = validated_resolution(request.resolution)
        result_images = validated_result_images(request.resultImages)
        width, height = aspect_ratio_dimensions(aspect_ratio, resolution)
        logger.info("[Generate] enhanced prompt: %s", enhanced_prompt)
        if is_soul_identity(lora):
            soul_service = HiggsfieldService()
            lora_soul_id = extract_soul_id(lora)
            soul_id = (request.characterId or "").strip() or lora_soul_id
            if request.characterId and lora_soul_id and request.characterId != lora_soul_id:
                raise HTTPException(status_code=400, detail="Character ID nao corresponde a identidade selecionada")

            reference_image_urls = [
                url.strip()
                for url in request.referenceImageUrls
                if isinstance(url, str) and url.strip().startswith("http")
            ][:5]
            logger.info(
                "[Generate] Soul Character reference handling: manual_reference_count=%s include_image_reference=%s",
                len(reference_image_urls),
                bool(reference_image_urls),
            )
            result = await soul_service.create_soul_character_image(
                prompt=enhanced_prompt,
                character_id=soul_id,
                character_name=lora.model_name,
                aspect_ratio=aspect_ratio,
                resolution=resolution,
                result_images=result_images,
                reference_image_urls=reference_image_urls,
            )
            logger.info("[Generate] Higgsfield result: %s", result)
        else:
            replicate_service = ReplicateService()
            logger.info(
                "[Generate] fallback replicate request: lora_name=%s, lora_url=%s, width=%s, height=%s",
                request.loraName,
                lora.fal_lora_url,
                width,
                height,
            )
            result = await replicate_service.generate_image(
                prompt=enhanced_prompt,
                lora_url=lora.fal_lora_url,
                lora_strength=0.95,
                width=width,
                height=height,
                steps=28,
                guidance_scale=4.0,
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
    image_urls: list[str] = []
    # replicate typically returns ["url"] or a url string
    if result and "output" in result:
        output = result.get("output", [])
        if isinstance(output, list) and len(output) > 0:
            image_url = output[0]
            image_urls = [item for item in output if isinstance(item, str)]
        elif isinstance(output, str):
            image_url = output
            image_urls = [output]
    elif result and isinstance(result, list) and len(result) > 0:
        image_url = result[0]
        image_urls = [item for item in result if isinstance(item, str)]
    elif result and isinstance(result, str):
        image_url = result
        image_urls = [result]
    
    if is_soul_identity(lora):
        request_id = result.get("request_id")
        task_id = f"hf_{request_id}" if request_id else f"hf_{uuid.uuid4().hex[:12]}"
        status_value = result.get("status", "queued")
    else:
        task_id = result.get("id") if result and result.get("id") else f"gen_{uuid.uuid4().hex[:12]}"
        status_value = "completed" if image_url else "processing"
    
    db_generation = Generation(
        user_id=lora.user_id,
        task_id=task_id,
        task_type="image",
        prompt=request.prompt,
        negative_prompt="",
        lora_id=lora.id,
        cum_effect=0,
        makeup=0,
        pose="soul-character",
        strength=1,
        lora_strength=1,
        girl_lora_strength=1,
        width=width,
        height=height,
        steps=1,
        guidance_scale=1,
        seed=None,
        output_url=image_url,
        status=status_value,
        progress=100 if image_url else (25 if is_soul_identity(lora) else 50),
    )
    db.add(db_generation)
    db.commit()
    
    return GenerationResponse(
        ok=True,
        taskId=task_id,
        status=db_generation.status,
        imageUrl=image_url,
        imageUrls=image_urls,
        message="Image generation completed" if image_url else "Processing",
    )


@router.get("/generate/status/{task_id}", response_model=GenerationResponse)
async def get_generation_status(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_licensed_user),
):
    """Get generation task status."""
    generation = db.query(Generation).filter(
        Generation.task_id == task_id
    ).first()
    
    if not generation:
        raise HTTPException(status_code=404, detail="Task not found")
    ensure_task_belongs_to_user(generation.user_id, current_user)
        
    if generation.status in ("pending", "created", "processing", "queued", "in_progress") and task_id.startswith("hf_"):
        try:
            soul_service = HiggsfieldService()
            request_id = task_id.split("_", 1)[1]
            prediction = await soul_service.get_request_status(request_id)
            new_status = prediction.get("status")
            if new_status == "completed":
                outputs = prediction.get("images", [])
                resolved_urls = [
                    output.get("url")
                    for output in outputs
                    if isinstance(output, dict) and output.get("url")
                ]
                if resolved_urls:
                    generation.output_url = resolved_urls[0]
                generation.status = "completed"
                generation.progress = 100
                db.commit()
            elif new_status in ("failed", "canceled", "nsfw"):
                generation.status = new_status
                generation.error_message = prediction.get("error") or new_status
                db.commit()
            elif new_status:
                generation.status = new_status
                generation.progress = 60
                db.commit()
        except Exception as e:
            import logging

            logging.error(f"Error polling Higgsfield generation task {task_id}: {e}")
    elif generation.status in ("pending", "created", "processing") and not task_id.startswith("gen_"):
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
    
    image_urls: list[str] = []
    if generation.status == "completed" and task_id.startswith("hf_"):
        try:
            prediction = await HiggsfieldService().get_request_status(task_id.split("_", 1)[1])
            outputs = prediction.get("images", [])
            image_urls = [
                output.get("url")
                for output in outputs
                if isinstance(output, dict) and output.get("url")
            ]
        except Exception:
            image_urls = [generation.output_url] if generation.output_url else []
    elif generation.output_url:
        image_urls = [generation.output_url]

    return GenerationResponse(
        ok=True,
        taskId=generation.task_id,
        status=generation.status,
        imageUrl=generation.output_url,
        imageUrls=image_urls,
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

    if request.userId.strip() != str(current_user.id):
        raise HTTPException(status_code=403, detail="User mismatch")

    uploaded_urls: list[str] = []
    async with httpx.AsyncClient(timeout=120.0) as client:
        for image_path in request.images:
            source_response = await client.get(f"{settings.internal_api_base_url}{image_path}")
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

    task_id = result.get("id") or result.get("taskId") or result.get("request_id") or f"edit_{uuid.uuid4().hex[:12]}"
    generation = Generation(
        user_id=current_user.id,
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
    current_user: User = Depends(get_current_licensed_user),
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
    current_user: User = Depends(get_current_licensed_user),
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
    current_user: User = Depends(get_current_licensed_user),
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
    current_user: User = Depends(get_current_licensed_user),
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
    current_user: User = Depends(get_current_licensed_user),
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
