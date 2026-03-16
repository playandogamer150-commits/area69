from fastapi import HTTPException

from app.api.v1.endpoints.generate import (
    aspect_ratio_dimensions,
    resolve_soul_character_id,
    resolve_soul_dimensions,
)
from app.models.schemas import GenerationRequest


def test_resolve_soul_dimensions_uses_canonical_portrait_size() -> None:
    request = GenerationRequest(
        prompt="teste",
        loraName="modelo",
        characterId="abc123",
        aspectRatio="4:3",
        resolution="1080p",
        resultImages=1,
        referenceImageUrls=[],
    )

    assert resolve_soul_dimensions(request) == (1152, 2048)


def test_non_soul_dimension_helper_still_maps_requested_shape() -> None:
    assert aspect_ratio_dimensions("4:3", "1080p") == (1536, 1152)


def test_resolve_soul_character_id_prefers_explicit_value() -> None:
    soul_id = "f1e8cdfd-0beb-4a8d-bc14-6705d3a4e159"
    assert resolve_soul_character_id(soul_id, soul_id) == soul_id


def test_resolve_soul_character_id_falls_back_to_lora_value() -> None:
    soul_id = "f1e8cdfd-0beb-4a8d-bc14-6705d3a4e159"
    assert resolve_soul_character_id(None, soul_id) == soul_id


def test_resolve_soul_character_id_normalizes_prefixed_value() -> None:
    soul_id = "f1e8cdfd-0beb-4a8d-bc14-6705d3a4e159"
    assert resolve_soul_character_id(f"soul-id:{soul_id}", soul_id) == soul_id


def test_resolve_soul_character_id_rejects_mismatch() -> None:
    try:
        resolve_soul_character_id("0a28f369-b104-4552-9508-346e9d0cab8f", "f1e8cdfd-0beb-4a8d-bc14-6705d3a4e159")
    except HTTPException as exc:
        assert exc.status_code == 400
        assert "nao corresponde" in str(exc.detail)
    else:
        raise AssertionError("Expected HTTPException for mismatched character ids")


def test_resolve_soul_character_id_rejects_invalid_uuid() -> None:
    try:
        resolve_soul_character_id(None, "f1e8")
    except HTTPException as exc:
        assert exc.status_code == 400
        assert "invalido" in str(exc.detail)
    else:
        raise AssertionError("Expected HTTPException for invalid UUID")
