from __future__ import annotations

import logging
import re
from typing import List, Optional

import io
import zipfile

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy.orm import Session

from app.models.database import LoRAModel, User, get_db
from app.core.config import Settings
from app.core.logging import get_logger
from app.core.security import get_current_licensed_user
from app.services.replicate_service import ReplicateService
from app.services.r2_storage import R2Storage

logger = get_logger(__name__)
settings = Settings()
router = APIRouter(prefix="/admin", tags=["Admin"])


def slugify_model_name(value: str) -> str:
    slug = re.sub(r"[^a-z0-9-]+", "-", value.lower()).strip("-")
    return slug or "modelclone-lora"


def resolve_or_create_user(user_id_value: str, db: Session) -> User:
    user = None
    try:
        user = db.query(User).filter(User.id == int(user_id_value)).first()
    except (TypeError, ValueError):
        user = None
    if user:
        return user

    if "@" in user_id_value:
        existing = db.query(User).filter(User.email == user_id_value).first()
        if existing:
            return existing

    email = f"user_{user_id_value}@example.com"
    user = db.query(User).filter(User.email == email).first()
    if user:
        return user

    try:
        user_id = int(user_id_value)
        existing = db.query(User).filter(User.id == user_id).first()
        if existing:
            max_user = db.query(User).order_by(User.id.desc()).first()
            user_id = (max_user.id + 1) if max_user else 1
        user = User(id=user_id, email=email, hashed_password="", name=user_id_value)
    except ValueError:
        max_user = db.query(User).order_by(User.id.desc()).first()
        new_id = (max_user.id + 1) if max_user else 1
        user = User(id=new_id, email=email, hashed_password="", name=user_id_value)

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


class LoRARecoveryRequest(BaseModel):
    userId: str = Field(..., description="ID único do usuário")
    modelName: str = Field(..., description="Nome do modelo LoRA")
    triggerWord: str = Field(..., description="Palavra de ativação do LoRA")
    enableNsfw: bool = Field(default=False, description="Habilitar conteúdo NSFW")
    referencePhotos: List[str] = Field(..., description="Paths das fotos salvas")
    falLoraUrl: Optional[str] = Field(None, description="URL do LoRA na fal.ai")

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
    """Create or recover a LoRA model for user identity."""
    logger.info(f"LoRA Recovery Request: userId={request.userId}, modelName={request.modelName}")

    if len(request.referencePhotos) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mínimo de 5 fotos requerido. Você enviou {len(request.referencePhotos)}."
        )

    if len(request.referencePhotos) > 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Máximo de 20 fotos permitido. Você enviou {len(request.referencePhotos)}."
        )

    if not request.triggerWord or len(request.triggerWord.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="triggerWord é obrigatório"
        )

    user = resolve_or_create_user(request.userId, db)
    user_id = user.id

    token = settings.REPLICATE_API_TOKEN
    
    if not token:
        db_lora = LoRAModel(
            user_id=user_id,
            model_name=request.modelName,
            fal_lora_url=None,
            trigger_word=request.triggerWord,
            enable_nsfw=request.enableNsfw,
            status="failed",
        )
        db.add(db_lora)
        db.commit()
        
        return LoRARecoveryResponse(
            ok=False,
            message="Replicate API token não configurado",
            loraId=str(db_lora.id),
            falLoraUrl=None,
            status="failed",
            referencePhotos=request.referencePhotos,
        )

    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                for i, path in enumerate(request.referencePhotos):
                    try:
                        img_response = await client.get(f"http://backend:8000{path}")
                        if img_response.status_code == 200:
                            ext = path.split('.')[-1] if '.' in path else 'jpg'
                            filename = f"image_{i+1}.{ext}"
                            zip_file.writestr(filename, img_response.content)
                    except Exception as e:
                        logger.warning(f"Failed to download image {path}: {e}")
            
            zip_buffer.seek(0)
            zip_content = zip_buffer.getvalue()
            
            r2 = R2Storage()
            zip_filename = f"lora-training/{user_id}/{request.modelName}/training_images.zip"
            r2_result = r2.upload_file(
                file_content=zip_content,
                file_name=zip_filename,
                content_type="application/zip",
                is_public=False,
            )
            
            if not r2_result.get("ok"):
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to upload ZIP to R2: {r2_result.get('error')}"
                )
            
            presigned = r2.generate_presigned_url(zip_filename, expiration=3600)
            file_url = presigned.get("url") if presigned.get("ok") else r2_result.get("file_url")
            if not file_url:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to resolve training ZIP URL",
                )
            logger.info(f"Uploaded ZIP to R2: {file_url}")
            
            logger.info(f"Starting LoRA training for user {user_id} with model {request.modelName}")
            logger.info(f"Trigger word: {request.triggerWord}, NSFW: {request.enableNsfw}")
            
            replicate_owner = settings.REPLICATE_OWNER
            if not replicate_owner:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="REPLICATE_OWNER não configurado no backend",
                )

            destination_model_name = f"mc2-{user_id}-{slugify_model_name(request.modelName)}"
            destination = f"{replicate_owner}/{destination_model_name}"
            replicate_service = ReplicateService(token)

            create_model_result = await replicate_service.create_model(
                owner=replicate_owner,
                name=destination_model_name,
                description=f"AREA 69 fine-tune for {request.modelName}",
                visibility="private",
            )
            if create_model_result.get("error") and "already exists" not in create_model_result.get("error", "").lower():
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=create_model_result["error"],
                )

            result = await replicate_service.train_lora(
                training_data_url=file_url,
                trigger_word=request.triggerWord,
                destination=destination,
                steps=1000,
            )

            logger.info(f"Replicate training response: {str(result)[:500]}")

            if result.get("error"):
                error_msg = result["error"]
                logger.error(error_msg)
                
                db_lora = LoRAModel(
                    user_id=user_id,
                    model_name=request.modelName,
                    fal_lora_url=None,
                    trigger_word=request.triggerWord,
                    enable_nsfw=request.enableNsfw,
                    status="failed",
                )
                db.add(db_lora)
                db.commit()
                
                return LoRARecoveryResponse(
                    ok=False,
                    message="Erro ao iniciar treino no Replicate",
                    loraId=str(db_lora.id),
                    falLoraUrl=None,
                    status="failed",
                    referencePhotos=request.referencePhotos,
                )
            
            prediction_id = result.get("id")
            prediction_status = result.get("status", "starting")
            
            db_lora = LoRAModel(
                user_id=user_id,
                model_name=request.modelName,
                fal_lora_url=destination,
                trigger_word=request.triggerWord,
                enable_nsfw=request.enableNsfw,
                status=prediction_status,
                replicate_prediction_id=prediction_id,
            )
            db.add(db_lora)
            db.commit()
            
            logger.info(f"LoRA training started: {db_lora.id}, prediction_id={prediction_id}, status={prediction_status}")

            return LoRARecoveryResponse(
                ok=True,
                message=f"Treinamento LoRA '{request.modelName}' iniciado. Status: {prediction_status}",
                loraId=str(db_lora.id),
                falLoraUrl=destination,
                status=prediction_status,
                referencePhotos=request.referencePhotos,
                predictionId=prediction_id,
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Exception: {str(e)}")

        db_lora = LoRAModel(
            user_id=user_id,
            model_name=request.modelName,
            fal_lora_url=None,
            trigger_word=request.triggerWord,
            enable_nsfw=request.enableNsfw,
            status="failed",
        )
        db.add(db_lora)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro: {str(e)}",
        )
