import asyncio

from app.services.higgsfield_service import HiggsfieldService


def test_create_soul_character_image_matches_playground_payload_shape() -> None:
    service = HiggsfieldService()
    captured: dict[str, object] = {}

    async def fake_request(method: str, endpoint: str, **kwargs):
        captured["method"] = method
        captured["endpoint"] = endpoint
        captured["kwargs"] = kwargs
        return {"ok": True}

    service._request = fake_request  # type: ignore[method-assign]

    asyncio.run(
        service.create_soul_character_image(
            prompt="a portrait",
            character_id="ref-123",
            character_name="mel-maia2",
            aspect_ratio="9:16",
            resolution="720p",
            result_images=4,
            reference_image_urls=[" https://cdn.example.com/ref.png "],
        )
    )

    assert captured["method"] == "POST"
    assert captured["endpoint"] == "/higgsfield-ai/soul/character"

    payload = captured["kwargs"]["json"]
    assert payload == {
        "prompt": "a portrait",
        "batch_size": 4,
        "resolution": "720p",
        "aspect_ratio": "9:16",
        "enhance_prompt": True,
        "style_id": "1cb4b936-77bf-4f9a-9039-f3d349a4cdbe",
        "style_strength": 1,
        "custom_reference_id": "ref-123",
        "custom_reference_strength": 1,
        "custom_reference_name": "mel-maia2",
        "image_reference_url": "https://cdn.example.com/ref.png",
    }


def test_create_soul_character_image_omits_reference_when_user_did_not_upload() -> None:
    service = HiggsfieldService()
    captured: dict[str, object] = {}

    async def fake_request(method: str, endpoint: str, **kwargs):
        captured["kwargs"] = kwargs
        return {"ok": True}

    service._request = fake_request  # type: ignore[method-assign]

    asyncio.run(
        service.create_soul_character_image(
            prompt="a portrait",
            character_id="ref-123",
            character_name="mel-maia2",
            aspect_ratio="9:16",
            resolution="1080p",
            result_images=1,
            reference_image_urls=[],
        )
    )

    payload = captured["kwargs"]["json"]
    assert "image_reference_url" not in payload
