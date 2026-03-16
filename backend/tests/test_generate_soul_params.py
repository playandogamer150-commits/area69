from app.api.v1.endpoints.generate import (
    aspect_ratio_dimensions,
    merge_reference_image_urls,
    extract_reference_media_urls,
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


def test_extract_reference_media_urls_ignores_invalid_entries() -> None:
    reference = {
        "reference_media": [
            {"media_url": " https://cdn.example.com/a.png "},
            {"media_url": ""},
            {"foo": "bar"},
            "invalid",
            {"media_url": "https://cdn.example.com/b.png"},
        ]
    }

    assert extract_reference_media_urls(reference) == [
        "https://cdn.example.com/a.png",
        "https://cdn.example.com/b.png",
    ]


def test_merge_reference_image_urls_prioritizes_manual_and_deduplicates() -> None:
    manual = ["https://cdn.example.com/custom.png", " https://cdn.example.com/dupe.png "]
    fallback = [
        "https://cdn.example.com/dupe.png",
        "https://cdn.example.com/ref-2.png",
        "https://cdn.example.com/ref-3.png",
        "https://cdn.example.com/ref-4.png",
        "https://cdn.example.com/ref-5.png",
        "https://cdn.example.com/ref-6.png",
    ]

    assert merge_reference_image_urls(manual, fallback, limit=5) == [
        "https://cdn.example.com/custom.png",
        "https://cdn.example.com/dupe.png",
        "https://cdn.example.com/ref-2.png",
        "https://cdn.example.com/ref-3.png",
        "https://cdn.example.com/ref-4.png",
    ]
