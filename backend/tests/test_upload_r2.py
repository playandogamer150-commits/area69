from __future__ import annotations

from io import BytesIO
from unittest.mock import AsyncMock

from app.api.v1.endpoints.auth import _encode_sms_verification_token
from app.models.database import User
from app.storage.paths import validate_user_storage_path


def register_and_login(client, email: str = "upload@example.com", password: str = "strongpass123") -> tuple[str, dict]:
    phone_number = f"+55119{abs(hash(email)) % 100000000:08d}"
    payload = {
        "email": email,
        "password": password,
        "name": "Upload User",
        "phoneNumber": phone_number,
        "smsVerificationToken": _encode_sms_verification_token(phone_number),
        "deviceFingerprint": f"fingerprint-{email}",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    body = response.json()
    return body["access_token"], body["user"]


def test_upload_edit_images_returns_r2_urls(client, db_session, monkeypatch):
    token, user = register_and_login(client)
    db_user = db_session.query(User).filter(User.id == user["id"]).first()
    assert db_user is not None
    db_user.license_status = "active"
    db_session.commit()

    uploaded_url = f"https://cdn.example.com/users/{user['id']}/image-edits/batch/file.jpg"

    monkeypatch.setattr(
        "app.api.upload.R2Storage.upload_file_async",
        AsyncMock(return_value={"ok": True, "file_url": uploaded_url}),
    )

    response = client.post(
        "/api/v1/upload/edit-images",
        data={"userId": str(user["id"])},
        files={"images": ("input.jpg", BytesIO(b"fake-image-content"), "image/jpeg")},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    saved = response.json()["saved"]
    assert len(saved) == 1
    assert saved[0]["path"] == uploaded_url
    assert saved[0]["publicUrl"] == uploaded_url


def test_validate_user_storage_path_accepts_r2_urls_for_same_user(monkeypatch):
    monkeypatch.setattr("app.storage.paths.settings.R2_PUBLIC_BASE_URL", "https://cdn.example.com")
    user = User(id=42, email="same@example.com", hashed_password="x")

    path = "https://cdn.example.com/users/42/image-edits/batch/file.jpg"
    validated = validate_user_storage_path(path, user, allowed_prefixes=("/storage/42/image-edits/",))

    assert validated == path
