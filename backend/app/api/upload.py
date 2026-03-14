from __future__ import annotations

import logging
import re
import uuid
from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.core.config import settings
from app.core.security import get_current_licensed_user
from app.models.database import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/upload", tags=["Upload"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MIN_PHOTOS = 5
MAX_PHOTOS = 20
MAX_EDIT_IMAGES = 6
MAX_GENERATE_REFERENCE_IMAGES = 5

ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
ALLOWED_GENERATION_REFERENCE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
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


def validate_image_file(photo: UploadFile, allowed_types: list[str] | None = None) -> None:
    normalized_allowed_types = allowed_types or ALLOWED_TYPES
    photo.file.seek(0, 2)
    file_size = photo.file.tell()
    photo.file.seek(0)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Arquivo {photo.filename} excede 10MB ({file_size / 1024 / 1024:.2f}MB)",
        )

    if photo.content_type not in normalized_allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de arquivo nao permitido: {photo.content_type}. Aceito: {normalized_allowed_types}",
        )


@router.post("/reference-photos")
async def upload_reference_photos(
    referencePhotos: List[UploadFile] = File(..., description="Fotos de referencia para Soul ID"),
    userId: str = Form(..., min_length=1, description="ID unico do usuario"),
    modelName: str = Form(..., min_length=1, description="Nome do modelo"),
    enableNsfw: bool = Form(default=False, description="Habilitar conteudo NSFW"),
    current_user: User = Depends(get_current_licensed_user),
):
    normalized_user_id = ensure_request_user_matches_current(userId, current_user)
    safe_model_name = sanitize_storage_segment(modelName, "modelName")
    logger.info("Reference upload: userId=%s modelName=%s photos=%s", normalized_user_id, safe_model_name, len(referencePhotos))

    if len(referencePhotos) < MIN_PHOTOS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Minimo de {MIN_PHOTOS} fotos requerido. Voce enviou {len(referencePhotos)}.",
        )

    selected_reference_photos = referencePhotos[:MAX_PHOTOS]
    for photo in selected_reference_photos:
        validate_image_file(photo)

    upload_dir = settings.storage_path / normalized_user_id / safe_model_name
    upload_dir.mkdir(parents=True, exist_ok=True)

    relative_root = f"/storage/{normalized_user_id}/{safe_model_name}"
    saved_files = []
    for photo in selected_reference_photos:
        file_id = str(uuid.uuid4())
        file_ext = photo.filename.split(".")[-1] if "." in photo.filename else "jpg"
        file_path = upload_dir / f"{file_id}.{file_ext}"
        content = await photo.read()
        with open(file_path, "wb") as buffer:
            buffer.write(content)

        saved_files.append(
            {
                "filename": f"{file_id}.{file_ext}",
                "path": f"{relative_root}/{file_id}.{file_ext}",
                "size": len(content),
                "contentType": photo.content_type,
            }
        )

    logger.info("Reference upload completed: %s files saved", len(saved_files))

    return {
        "ok": True,
        "message": f"{len(saved_files)} fotos salvas com sucesso",
        "saved": saved_files,
        "userId": normalized_user_id,
        "modelName": safe_model_name,
        "enableNsfw": enableNsfw,
        "totalUploaded": len(referencePhotos),
        "usedCount": len(saved_files),
        "ignoredCount": max(0, len(referencePhotos) - len(saved_files)),
        "nextStep": "Use os caminhos em 'saved' para chamar POST /api/v1/admin/lora-recovery e criar a identidade no Soul ID",
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
    relative_root = f"/storage/{normalized_user_id}/image-edits/{batch_id}"
    for image in images:
        file_id = str(uuid.uuid4())
        file_ext = image.filename.split(".")[-1] if "." in image.filename else "jpg"
        file_path = upload_dir / f"{file_id}.{file_ext}"
        content = await image.read()
        with open(file_path, "wb") as buffer:
            buffer.write(content)

        saved_files.append(
            {
                "filename": f"{file_id}.{file_ext}",
                "path": f"{relative_root}/{file_id}.{file_ext}",
                "size": len(content),
                "contentType": image.content_type,
            }
        )

    return {
        "ok": True,
        "message": f"{len(saved_files)} imagens salvas com sucesso",
        "saved": saved_files,
        "userId": normalized_user_id,
        "batchId": batch_id,
    }


@router.post("/generate-reference-images")
async def upload_generate_reference_images(
    images: List[UploadFile] = File(..., description="Imagens de referencia para Soul Character (1 a 5)"),
    userId: str = Form(..., min_length=1, description="ID unico do usuario"),
    current_user: User = Depends(get_current_licensed_user),
):
    normalized_user_id = ensure_request_user_matches_current(userId, current_user)

    if len(images) < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Envie ao menos 1 imagem de referencia.",
        )

    if len(images) > MAX_GENERATE_REFERENCE_IMAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximo de {MAX_GENERATE_REFERENCE_IMAGES} imagens de referencia permitido.",
        )

    for image in images:
        validate_image_file(image, ALLOWED_GENERATION_REFERENCE_TYPES)

    batch_id = str(uuid.uuid4())
    upload_dir = settings.storage_path / normalized_user_id / "generate-references" / batch_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    saved_files = []
    relative_root = f"/storage/{normalized_user_id}/generate-references/{batch_id}"
    for image in images:
        file_id = str(uuid.uuid4())
        file_ext = image.filename.split(".")[-1] if "." in image.filename else "jpg"
        file_path = upload_dir / f"{file_id}.{file_ext}"
        content = await image.read()
        with open(file_path, "wb") as buffer:
            buffer.write(content)

        relative_path = f"{relative_root}/{file_id}.{file_ext}"
        saved_files.append(
            {
                "filename": f"{file_id}.{file_ext}",
                "path": relative_path,
                "publicUrl": f"{settings.BACKEND_PUBLIC_URL.rstrip('/')}{relative_path}",
                "size": len(content),
                "contentType": image.content_type,
            }
        )

    return {
        "ok": True,
        "message": f"{len(saved_files)} referencias salvas com sucesso",
        "saved": saved_files,
        "userId": normalized_user_id,
        "batchId": batch_id,
    }
