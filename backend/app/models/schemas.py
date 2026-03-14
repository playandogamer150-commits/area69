from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, model_validator


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
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    prompt: str = Field(validation_alias=AliasChoices("prompt", "Prompt"))
    loraName: str = Field(validation_alias=AliasChoices("loraName", "lora_name", "LoRA Name"))
    characterId: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("characterId", "character_id", "Character ID"),
    )
    aspectRatio: str = Field(
        default="9:16",
        validation_alias=AliasChoices("aspectRatio", "aspect_ratio", "Aspect Ratio"),
    )
    resolution: str = Field(
        default="1080p",
        validation_alias=AliasChoices("resolution", "Resolution"),
    )
    resultImages: int = Field(
        1,
        ge=1,
        le=4,
        validation_alias=AliasChoices("resultImages", "result_images", "Result Images"),
    )
    referenceImageUrls: list[str] = Field(
        default_factory=list,
        validation_alias=AliasChoices("referenceImageUrls", "reference_image_urls", "Image Reference URL"),
    )

    @model_validator(mode="before")
    @classmethod
    def normalize_reference_images(cls, data):
        if not isinstance(data, dict):
            return data

        normalized = dict(data)
        reference_value = normalized.get("referenceImageUrls")
        if reference_value is None:
            reference_value = normalized.get("reference_image_urls")
        if reference_value is None:
            reference_value = normalized.get("Image Reference URL")

        if reference_value is None:
            normalized["referenceImageUrls"] = []
        elif isinstance(reference_value, str):
            normalized["referenceImageUrls"] = [reference_value]
        else:
            normalized["referenceImageUrls"] = reference_value

        return normalized


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
