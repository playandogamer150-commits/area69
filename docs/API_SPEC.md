# AREA 69 API Specification

## Overview
AREA 69 is an AI-powered identity cloning platform that enables users to create personalized LoRA models, generate images, perform face swaps, and create videos using advanced AI models.

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication
Currently using simple user ID in requests. JWT authentication coming in future versions.

## Endpoints

### LoRA Management

#### POST /admin/lora-recovery
Create or recover a LoRA model.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| user_id | string | Yes | User identifier |
| model_name | string | Yes | Name for the model |
| trigger_word | string | Yes | Word to activate the LoRA |
| enable_nsfw | boolean | Yes | Enable NSFW content |
| reference_photos | file[] | Yes | 5-20 reference images |

**Response:**
```json
{
  "success": true,
  "falLoraUrl": "https://...",
  "message": "LoRA training started"
}
```

#### GET /user/loras
List all LoRAs for a user.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| user_id | string | Yes | User identifier |

**Response:**
```json
[
  {
    "loraId": "1",
    "modelName": "my-identity",
    "status": "ready",
    "progress": 100,
    "falLoraUrl": "https://...",
    "triggerWord": "mymodel",
    "enableNsfw": true,
    "createdAt": "2024-01-01T00:00:00",
    "updatedAt": "2024-01-01T00:00:00"
  }
]
```

#### GET /user/loras/{lora_id}
Get status of a specific LoRA.

### Image Generation

#### POST /generate/image
Generate image with NSFW granular controls.

**Parameters:**
| Name | Type | Required | Range | Description |
|------|------|----------|-------|-------------|
| prompt | string | Yes | - | Image description |
| negativePrompt | string | No | - | What to avoid |
| loraName | string | Yes | - | LoRA model name |
| loraStrength | float | No | 0-1 | Identity strength |
| girlLoraStrength | float | No | 0-1 | Female identity strength |
| cumEffect | float | No | 0-1 | Ejaculation effect |
| makeup | float | No | 0-1 | Makeup intensity |
| pose | string | No | - | Body pose |
| strength | float | No | 0-1 | Overall NSFW intensity |
| width | int | No | - | Image width (default 1024) |
| height | int | No | - | Image height (default 1024) |
| steps | int | No | - | Inference steps |
| guidanceScale | float | No | - | CFG scale |
| seed | int | No | - | Random seed |

**Response:**
```json
{
  "ok": true,
  "taskId": "gen_abc123",
  "status": "completed",
  "imageUrl": "https://..."
}
```

### Face Swap

#### POST /generate/face-swap
Face swap on static image.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| source_image_url | string | Yes | Source face |
| target_image_url | string | Yes | Target image |
| lora_strength | float | No | Swap strength |

#### POST /generate/face-swap-video
Face swap on video.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| source_video_url | string | Yes | Source video |
| target_image_url | string | Yes | Target face |
| lora_strength | float | No | Swap strength |

### Video Generation

#### POST /generate/video-motion
Generate animated video from image.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| image_prompt | string | Yes | Image description |
| lora_name | string | No | LoRA to apply |
| lora_strength | float | No | Identity strength |

#### POST /generate/video-directly
Generate video from audio + image.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| audio_file | string | Yes | Audio URL |
| image_reference | string | Yes | Reference image |

## NSFW Parameters

The following granular controls are available for NSFW content generation:

| Parameter | Type | Range | Description |
|-----------|------|-------|-------------|
| cumEffect | float | 0-1 | Ejaculation effect intensity |
| makeup | float | 0-1 | Makeup intensity |
| pose | string | standing/sitting/lying/kneeling/custom | Body pose |
| strength | float | 0-1 | Overall NSFW intensity |
| loraStrength | float | 0-1 | Identity clone strength |
| girlLoraStrength | float | 0-1 | Female identity specific strength |

## Error Responses

All endpoints may return error responses:

```json
{
  "detail": "Error message"
}
```

Common HTTP status codes:
- 200: Success
- 400: Bad Request
- 404: Not Found
- 500: Internal Server Error
