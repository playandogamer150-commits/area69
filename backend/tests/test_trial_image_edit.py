from __future__ import annotations

from io import BytesIO
from unittest.mock import AsyncMock

from app.models.database import Generation, User


def register_user(client, email: str, password: str = "strongpass123", name: str = "Trial User") -> dict:
    response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "name": name, "deviceFingerprint": f"fingerprint-{email}"},
    )
    assert response.status_code == 200
    return response.json()


class FakeImageResponse:
    status_code = 200
    headers = {"content-type": "image/jpeg"}

    def __init__(self, content: bytes = b"fake-image-bytes") -> None:
        self.content = content


class FakeAsyncClient:
    def __init__(self, *args, **kwargs) -> None:
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def get(self, url: str) -> FakeImageResponse:
        return FakeImageResponse()


def test_trial_user_can_upload_edit_images_without_license(client, monkeypatch):
    register_response = register_user(client, "trial-upload@example.com")

    monkeypatch.setattr(
        "app.api.upload.R2Storage.upload_file_async",
        AsyncMock(return_value={"ok": True, "file_url": "https://cdn.example.com/users/1/image-edits/batch/file.jpg"}),
    )

    response = client.post(
        "/api/v1/upload/edit-images",
        data={"userId": str(register_response["user"]["id"])},
        files={"images": ("input.jpg", BytesIO(b"fake-image-content"), "image/jpeg")},
        headers={"Authorization": f"Bearer {register_response['access_token']}"},
    )

    assert response.status_code == 200


def test_trial_image_edit_consumes_credit(client, db_session, monkeypatch):
    register_response = register_user(client, "trial-edit@example.com")
    user_id = register_response["user"]["id"]

    monkeypatch.setattr("app.api.v1.endpoints.generate.settings.WAVESPEED_API_KEY", "test-key")
    monkeypatch.setattr("app.api.v1.endpoints.generate.httpx.AsyncClient", FakeAsyncClient)
    monkeypatch.setattr(
        "app.api.v1.endpoints.generate.WaveSpeedService.upload_binary",
        AsyncMock(return_value={"download_url": "https://wavespeed.example.com/uploaded.jpg"}),
    )
    monkeypatch.setattr(
        "app.api.v1.endpoints.generate.WaveSpeedService.submit_image_edit",
        AsyncMock(return_value={"id": "trial-edit-task", "status": "processing"}),
    )

    response = client.post(
        "/api/v1/generate/image-edit",
        json={
            "userId": str(user_id),
            "images": [f"/storage/{user_id}/image-edits/batch/input.jpg"],
            "prompt": "Make the lighting more dramatic",
            "size": "1024*1024",
            "seed": -1,
        },
        headers={"Authorization": f"Bearer {register_response['access_token']}"},
    )

    assert response.status_code == 200

    db_user = db_session.query(User).filter(User.id == user_id).first()
    assert db_user is not None
    assert db_user.trial_edit_credits_remaining == 1

    generation = db_session.query(Generation).filter(Generation.task_id == "trial-edit-task").first()
    assert generation is not None
    assert generation.task_type == "image_edit"


def test_trial_user_is_blocked_when_edit_credits_run_out(client, db_session):
    register_response = register_user(client, "trial-exhausted@example.com")
    user_id = register_response["user"]["id"]

    db_user = db_session.query(User).filter(User.id == user_id).first()
    assert db_user is not None
    db_user.trial_edit_credits_remaining = 0
    db_session.commit()

    response = client.post(
        "/api/v1/upload/edit-images",
        data={"userId": str(user_id)},
        files={"images": ("input.jpg", BytesIO(b"fake-image-content"), "image/jpeg")},
        headers={"Authorization": f"Bearer {register_response['access_token']}"},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Image edit trial exhausted"


def test_trial_user_can_read_own_image_edit_status_even_without_credits(client, db_session, monkeypatch):
    register_response = register_user(client, "trial-status@example.com")
    user_id = register_response["user"]["id"]

    db_user = db_session.query(User).filter(User.id == user_id).first()
    assert db_user is not None
    db_user.trial_edit_credits_remaining = 0

    db_session.add(
        Generation(
            user_id=user_id,
            task_id="trial-status-task",
            task_type="image_edit",
            prompt="edit prompt",
            negative_prompt="",
            status="processing",
            progress=25,
            output_url="",
        )
    )
    db_session.commit()

    monkeypatch.setattr(
        "app.api.v1.endpoints.generate.WaveSpeedService.get_result",
        AsyncMock(return_value={"status": "processing"}),
    )

    response = client.get(
        "/api/v1/generate/status/trial-status-task",
        headers={"Authorization": f"Bearer {register_response['access_token']}"},
    )

    assert response.status_code == 200
    assert response.json()["taskId"] == "trial-status-task"
