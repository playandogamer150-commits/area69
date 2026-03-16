from app.api.v1.endpoints.generate import (
    aspect_ratio_dimensions,
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
