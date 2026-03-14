from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# LoRA Schemas
class LoRARequest(BaseModel):
    userId: str
    modelName: str
    falLoraUrl: Optional[str] = None
    triggerWord: str
    enableNsfw: bool


class LoRAResponse(BaseModel):
    success: bool
    falLoraUrl: Optional[str] = None
    message: Optional[str] = None


class LoRAStatus(BaseModel):
    loraId: str
    modelName: str
    status: str
    progress: int
    falLoraUrl: Optional[str] = None
    triggerWord: str
    enableNsfw: bool
    createdAt: str
    updatedAt: str


# Generation Schemas (Soul Character)
class GenerationRequest(BaseModel):
    prompt: str
    loraName: str
    characterId: Optional[str] = None
    aspectRatio: str = "9:16"
    resolution: str = "1080p"
    resultImages: int = Field(1, ge=1, le=4)
    referenceImageUrls: list[str] = Field(default_factory=list)


class GenerationResponse(BaseModel):
    ok: bool
    taskId: str
    status: str
    imageUrl: Optional[str] = None
    imageUrls: list[str] = Field(default_factory=list)
    message: Optional[str] = None
    progress: Optional[int] = None


class ImageEditRequest(BaseModel):
    userId: str
    images: list[str]
    prompt: str
    size: Optional[str] = None
    seed: int = -1


class ImageEditResponse(BaseModel):
    ok: bool
    taskId: str
    status: str
    imageUrl: Optional[str] = None
    message: Optional[str] = None


# Face Swap Schemas
class FaceSwapRequest(BaseModel):
    source_image_url: str
    target_image_url: str
    lora_strength: float = Field(0.0, ge=0.0, le=1.0)


class FaceSwapResponse(BaseModel):
    ok: bool
    output_url: Optional[str] = None
    message: Optional[str] = None


class FaceSwapVideoRequest(BaseModel):
    source_video_url: str
    target_image_url: str
    lora_strength: float = Field(0.0, ge=0.0, le=1.0)


class FaceSwapVideoResponse(BaseModel):
    ok: bool
    output_video_url: Optional[str] = None
    message: Optional[str] = None


class ImageFaceswapRequest(BaseModel):
    image_url: str
    source_url: str
    dest_url: str


class ImageFaceswapResponse(BaseModel):
    ok: bool
    output_url: Optional[str] = None


# Video Schemas
class VideoMotionRequest(BaseModel):
    image_prompt: str
    lora_name: Optional[str] = None
    lora_strength: float = Field(0.0, ge=0.0, le=1.0)


class VideoMotionResponse(BaseModel):
    ok: bool
    video_url: Optional[str] = None


class VideoDirectRequest(BaseModel):
    audio_file: str
    image_reference: str


class VideoDirectResponse(BaseModel):
    ok: bool
    video_url: Optional[str] = None


# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class UserCreate(BaseModel):
    email: str
    password: str
    name: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
