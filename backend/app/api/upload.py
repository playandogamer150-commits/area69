from __future__ import annotations

from typing import List
import uuid
from pathlib import Path
import logging
import re

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status

from app.core.config import settings
from app.core.security import get_current_licensed_user
from app.models.database import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/upload", tags=["Upload"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MIN_PHOTOS = 5
MAX_PHOTOS = 20
MAX_EDIT_IMAGES = 6

ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
SAFE_SEGMENT_RE = re.compile(r"[^a-zA-Z0-9_-]+")


def sanitize_storage_segment(value: str, field_name: str) -> str:
    normalized = SAFE_SEGMENT_RE.sub("-", value.strip()).strip("-_.")
    if not normalized:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{field_name} invalido")
    return normalized


def ensure_request_user_matches_current(user_id: str, current_user: User) -> str:
    normalized = user_id.strip()
    if normalized != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User mismatch")
    return normalized


def validate_image_file(photo: UploadFile) -> None:
    photo.file.seek(0, 2)
    file_size = photo.file.tell()
    photo.file.seek(0)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Arquivo {photo.filename} excede 10MB ({file_size / 1024 / 1024:.2f}MB)"
        )

    if photo.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de arquivo não permitido: {photo.content_type}. Aceito: {ALLOWED_TYPES}"
        )


@router.post("/reference-photos")
async def upload_reference_photos(
    referencePhotos: List[UploadFile] = File(..., description="Fotos de referência para treinamento LoRA (mínimo 5, máximo 20)"),
    userId: str = Form(..., min_length=1, description="ID único do usuário"),
    modelName: str = Form(..., min_length=1, description="Nome do modelo LoRA"),
    enableNsfw: bool = Form(default=False, description="Habilitar conteúdo NSFW - CRÍTICO para treinamento explícito"),
    current_user: User = Depends(get_current_licensed_user),
):
    """Upload reference photos for LoRA training."""
    normalized_user_id = ensure_request_user_matches_current(userId, current_user)
    safe_model_name = sanitize_storage_segment(modelName, "modelName")
    logger.info(f"Upload received: userId={normalized_user_id}, modelName={safe_model_name}, photos={len(referencePhotos)}")

    if len(referencePhotos) < MIN_PHOTOS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mínimo de {MIN_PHOTOS} fotos requerido. Você enviou {len(referencePhotos)}."
        )

    if len(referencePhotos) > MAX_PHOTOS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Máximo de {MAX_PHOTOS} fotos permitido. Você enviou {len(referencePhotos)}."
        )

    for photo in referencePhotos:
        validate_image_file(photo)

    upload_dir = settings.storage_path / normalized_user_id / safe_model_name
    upload_dir.mkdir(parents=True, exist_ok=True)

    saved_files = []
    for photo in referencePhotos:
        file_id = str(uuid.uuid4())
        file_ext = photo.filename.split(".")[-1] if "." in photo.filename else "jpg"
        file_path = upload_dir / f"{file_id}.{file_ext}"

        content = await photo.read()
        with open(file_path, "wb") as buffer:
            buffer.write(content)

        relative_path = f"/storage/{normalized_user_id}/{safe_model_name}/{file_id}.{file_ext}"
        saved_files.append({
            "filename": f"{file_id}.{file_ext}",
            "path": relative_path,
            "size": len(content),
            "contentType": photo.content_type
        })

    logger.info(f"Upload completed: {len(saved_files)} files saved")

    return {
        "ok": True,
        "message": f"{len(saved_files)} fotos salvas com sucesso",
        "saved": saved_files,
        "userId": normalized_user_id,
        "modelName": safe_model_name,
        "enableNsfw": enableNsfw,
        "nextStep": "Use os caminhos em 'saved' para chamar POST /api/v1/admin/lora-recovery"
    }


@router.post("/edit-images")
async def upload_edit_images(
    images: List[UploadFile] = File(..., description="Imagens para edicao WaveSpeed (1 a 6)"),
    userId: str = Form(..., min_length=1, description="ID unico do usuario"),
    current_user: User = Depends(get_current_licensed_user),
):
    normalized_user_id = ensure_request_user_matches_current(userId, current_user)
    if len(images) < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Envie ao menos 1 imagem para editar.",
        )

    if len(images) > MAX_EDIT_IMAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximo de {MAX_EDIT_IMAGES} imagens permitido. Voce enviou {len(images)}.",
        )

    for image in images:
        validate_image_file(image)

    batch_id = str(uuid.uuid4())
    upload_dir = settings.storage_path / normalized_user_id / "image-edits" / batch_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    saved_files = []
    for image in images:
        file_id = str(uuid.uuid4())
        file_ext = image.filename.split(".")[-1] if "." in image.filename else "jpg"
        file_path = upload_dir / f"{file_id}.{file_ext}"
        content = await image.read()
        with open(file_path, "wb") as buffer:
            buffer.write(content)

        relative_path = f"/storage/{normalized_user_id}/image-edits/{batch_id}/{file_id}.{file_ext}"
        saved_files.append({
            "filename": f"{file_id}.{file_ext}",
            "path": relative_path,
            "size": len(content),
            "contentType": image.content_type,
        })

    return {
        "ok": True,
        "message": f"{len(saved_files)} imagens salvas com sucesso",
        "saved": saved_files,
        "userId": normalized_user_id,
        "batchId": batch_id,
    }
