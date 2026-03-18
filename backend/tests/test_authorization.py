from __future__ import annotations

from datetime import datetime
from io import BytesIO

from app.api.v1.endpoints.auth import _encode_sms_verification_token
from app.models.database import Generation, User


def register_user(client, email: str, password: str = "strongpass123", name: str = "User") -> dict:
    phone_number = f"+55119{abs(hash(email)) % 100000000:08d}"
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": password,
            "name": name,
            "phoneNumber": phone_number,
            "smsVerificationToken": _encode_sms_verification_token(phone_number),
            "deviceFingerprint": f"fingerprint-{email}",
        },
    )
    assert response.status_code == 200
    return response.json()


def activate_user_license(db_session, user_id: int) -> None:
    user = db_session.query(User).filter(User.id == user_id).first()
    assert user is not None
    user.license_status = "active"
    db_session.commit()


def test_user_stats_requires_authenticated_owner(client, test_user_data):
    register_response = register_user(client, test_user_data["email"], test_user_data["password"], test_user_data["name"])
    token = register_response["access_token"]

    response = client.get(
        "/api/v1/user/stats",
        params={"userId": "999"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_generation_status_cannot_be_read_by_another_user(client, db_session):
    owner = register_user(client, "owner@example.com")
    intruder = register_user(client, "intruder@example.com")
    activate_user_license(db_session, owner["user"]["id"])
    activate_user_license(db_session, intruder["user"]["id"])

    generation = Generation(
        user_id=owner["user"]["id"],
        task_id="gen-owned",
        task_type="image",
        prompt="private prompt",
        negative_prompt="",
        status="completed",
        progress=100,
        output_url="https://example.com/private.png",
        created_at=datetime.utcnow(),
    )
    db_session.add(generation)
    db_session.commit()

    response = client.get(
        "/api/v1/generate/status/gen-owned",
        headers={"Authorization": f"Bearer {intruder['access_token']}"},
    )

    assert response.status_code == 403


def test_upload_reference_photos_rejects_user_mismatch(client, db_session):
    register_response = register_user(client, "licensed@example.com")
    activate_user_license(db_session, register_response["user"]["id"])

    files = [
        ("referencePhotos", (f"image-{index}.png", BytesIO(b"\x89PNG\r\n\x1a\n"), "image/png"))
        for index in range(5)
    ]
    data = {
        "userId": "999",
        "modelName": "test-model",
        "enableNsfw": "false",
    }

    response = client.post(
        "/api/v1/upload/reference-photos",
        data=data,
        files=files,
        headers={"Authorization": f"Bearer {register_response['access_token']}"},
    )

    assert response.status_code == 403


def test_lora_recovery_rejects_reference_photo_from_another_user(client, db_session):
    owner = register_user(client, "owner2@example.com")
    intruder = register_user(client, "intruder2@example.com")
    activate_user_license(db_session, owner["user"]["id"])
    activate_user_license(db_session, intruder["user"]["id"])

    response = client.post(
        "/api/v1/admin/lora-recovery",
        json={
            "userId": str(intruder["user"]["id"]),
            "modelName": "private-model",
            "triggerWord": "trigger",
            "enableNsfw": False,
            "referencePhotos": [f"/storage/{owner['user']['id']}/model/photo-1.png"] * 5,
        },
        headers={"Authorization": f"Bearer {intruder['access_token']}"},
    )

    assert response.status_code == 403


def test_image_edit_rejects_storage_path_outside_allowed_folder(client, db_session):
    register_response = register_user(client, "licensed-edit@example.com")
    activate_user_license(db_session, register_response["user"]["id"])

    response = client.post(
        "/api/v1/generate/image-edit",
        json={
            "userId": str(register_response["user"]["id"]),
            "images": [f"/storage/{register_response['user']['id']}/private/model/image.png"],
            "prompt": "edit this",
            "size": "1024x1024",
            "seed": -1,
        },
        headers={"Authorization": f"Bearer {register_response['access_token']}"},
    )

    assert response.status_code == 400
