from __future__ import annotations

from unittest.mock import AsyncMock

from app.api.v1.endpoints.auth import _encode_sms_verification_token
from app.models.database import LoRAModel, User


def register_and_activate(client, db_session):
    phone_number = "+5511988887777"
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "soul@example.com",
            "password": "strongpass123",
            "name": "Soul User",
            "phoneNumber": phone_number,
            "smsVerificationToken": _encode_sms_verification_token(phone_number),
            "deviceFingerprint": "fingerprint-soul",
        },
    )
    body = response.json()
    db_user = db_session.query(User).filter(User.id == body["user"]["id"]).first()
    assert db_user is not None
    db_user.license_status = "active"
    db_session.commit()
    return body


def create_ready_soul_lora(db_session, user_id: int) -> LoRAModel:
    lora = LoRAModel(
        user_id=user_id,
        model_name="mel-maia2",
        fal_lora_url="soul-id:ref-123",
        trigger_word="melmaia",
        status="ready",
        progress=100,
    )
    db_session.add(lora)
    db_session.commit()
    db_session.refresh(lora)
    return lora


def test_generate_image_does_not_inject_identity_media_as_reference_when_none_selected(client, db_session, monkeypatch):
    auth = register_and_activate(client, db_session)
    create_ready_soul_lora(db_session, auth["user"]["id"])

    create_mock = AsyncMock(return_value={"request_id": "req-123", "status": "queued"})
    get_soul_id_mock = AsyncMock(return_value={"reference_media": [{"media_url": "https://cdn.example.com/identity.jpg"}]})
    monkeypatch.setattr(
        "app.api.v1.endpoints.generate.HiggsfieldService.create_soul_character_image",
        create_mock,
    )
    monkeypatch.setattr(
        "app.api.v1.endpoints.generate.HiggsfieldService.get_soul_id",
        get_soul_id_mock,
    )

    response = client.post(
        "/api/v1/generate/image",
        json={
            "prompt": "essa mulher esta usando um biquini azul na praia",
            "loraName": "mel-maia2",
            "characterId": "ref-123",
            "aspectRatio": "9:16",
            "resolution": "1080p",
            "resultImages": 1,
            "referenceImageUrls": [],
        },
        headers={"Authorization": f"Bearer {auth['access_token']}"},
    )

    assert response.status_code == 200
    assert create_mock.await_count == 1
    assert create_mock.await_args.kwargs["reference_image_urls"] == []
    assert get_soul_id_mock.await_count == 0
