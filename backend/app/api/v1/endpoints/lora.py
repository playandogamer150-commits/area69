from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.core.security import get_current_licensed_user
from app.models.database import LoRAModel, User, get_db
from app.services.higgsfield_service import HiggsfieldService
from app.storage import build_public_storage_url, validate_user_storage_path

logger = get_logger(__name__)
router = APIRouter(prefix="/admin", tags=["Admin"])


def normalize_model_name(value: str) -> str:
    normalized = value.strip()
    if not normalized:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="modelName invalido")
    return normalized


def soul_reference_marker(reference_id: str | None) -> str | None:
    if not reference_id:
        return None
    return f"soul-id:{reference_id}"


class LoRARecoveryRequest(BaseModel):
    userId: str = Field(..., description="ID unico do usuario")
    modelName: str = Field(..., description="Nome do modelo")
    triggerWord: str = Field(..., description="Palavra de ativacao")
    enableNsfw: bool = Field(default=False, description="Habilitar conteudo NSFW")
    referencePhotos: List[str] = Field(..., description="Paths das fotos salvas")
    falLoraUrl: Optional[str] = Field(None, description="Compatibilidade legada")

    model_config = ConfigDict(populate_by_name=True)


class LoRARecoveryResponse(BaseModel):
    ok: bool
    message: str
    loraId: Optional[str] = None
    falLoraUrl: Optional[str] = None
    status: str
    referencePhotos: List[str] = []
    predictionId: Optional[str] = None


@router.post("/lora-recovery", response_model=LoRARecoveryResponse)
async def create_or_recover_lora(
    request: LoRARecoveryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_licensed_user),
):
    logger.info("Soul ID Request: userId=%s, modelName=%s", request.userId, request.modelName)

    if len(request.referencePhotos) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Minimo de 5 fotos requerido. Voce enviou {len(request.referencePhotos)}.",
        )

    if not request.triggerWord or len(request.triggerWord.strip()) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="triggerWord e obrigatorio")

    if request.userId.strip() != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User mismatch")

    user_id = current_user.id
    safe_model_name = normalize_model_name(request.modelName)
    selected_reference_photos = request.referencePhotos[:20]
    safe_reference_photos = [
        validate_user_storage_path(path, current_user)
        for path in selected_reference_photos
    ]

    higgsfield_service = HiggsfieldService()
    if not higgsfield_service.is_configured:
        db_lora = LoRAModel(
            user_id=user_id,
            model_name=safe_model_name,
            fal_lora_url=None,
            trigger_word=request.triggerWord,
            enable_nsfw=request.enableNsfw,
            status="failed",
        )
        db.add(db_lora)
        db.commit()

        return LoRARecoveryResponse(
            ok=False,
            message="Higgsfield Soul ID nao configurado",
            loraId=str(db_lora.id),
            falLoraUrl=None,
            status="failed",
            referencePhotos=safe_reference_photos,
        )

    try:
        input_images = [build_public_storage_url(path) for path in safe_reference_photos]
        logger.info("Creating Soul ID for user %s with %s images", user_id, len(input_images))

        result = await higgsfield_service.create_soul_id(
            name=safe_model_name,
            input_images=input_images,
        )
        logger.info("Higgsfield custom reference response: %s", str(result)[:500])

        if result.get("error"):
            logger.error(result["error"])

            db_lora = LoRAModel(
                user_id=user_id,
                model_name=safe_model_name,
                fal_lora_url=None,
                trigger_word=request.triggerWord,
                enable_nsfw=request.enableNsfw,
                status="failed",
            )
            db.add(db_lora)
            db.commit()

            return LoRARecoveryResponse(
                ok=False,
                message="Erro ao criar Soul ID no Higgsfield",
                loraId=str(db_lora.id),
                falLoraUrl=None,
                status="failed",
                referencePhotos=safe_reference_photos,
            )

        reference_id = result.get("id")
        reference_status = result.get("status", "queued")
        db_status = "ready" if reference_status == "completed" else reference_status
        reference_marker = soul_reference_marker(reference_id)

        db_lora = LoRAModel(
            user_id=user_id,
            model_name=safe_model_name,
            fal_lora_url=reference_marker,
            trigger_word=request.triggerWord,
            enable_nsfw=request.enableNsfw,
            status=db_status,
            replicate_prediction_id=None,
        )
        db.add(db_lora)
        db.commit()

        logger.info(
            "Soul ID creation started: lora_id=%s reference_id=%s status=%s",
            db_lora.id,
            reference_id,
            db_status,
        )

        return LoRARecoveryResponse(
            ok=True,
            message=f"Soul ID '{safe_model_name}' iniciado. Status: {db_status}",
            loraId=str(db_lora.id),
            falLoraUrl=reference_marker,
            status=db_status,
            referencePhotos=safe_reference_photos,
            predictionId=reference_id,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Exception creating Soul ID: %s", exc)

        db_lora = LoRAModel(
            user_id=user_id,
            model_name=safe_model_name,
            fal_lora_url=None,
            trigger_word=request.triggerWord,
            enable_nsfw=request.enableNsfw,
            status="failed",
        )
        db.add(db_lora)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro: {str(exc)}",
        )
