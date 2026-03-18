from app.api.v1.endpoints.auth import _encode_sms_verification_token
from app.models.database import GalleryItem

def register_and_login(client, email: str = "gallery@example.com", password: str = "strongpass123") -> tuple[str, dict]:
    phone_number = f"+55119{abs(hash(email)) % 100000000:08d}"
    payload = {
        "email": email,
        "password": password,
        "name": "Gallery User",
        "phoneNumber": phone_number,
        "smsVerificationToken": _encode_sms_verification_token(phone_number),
        "deviceFingerprint": f"fingerprint-{email}",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    body = response.json()
    return body["access_token"], body["user"]


def test_gallery_crud_and_filters(client, db_session):
    token, user = register_and_login(client, email="gallery@example.com")

    create_response = client.post(
        "/api/v1/user/gallery",
        json={
            "clientId": "edit-task-1",
            "sourceType": "image_edit",
            "imageUrl": "https://cdn.example.com/edit-1.jpg",
            "prompt": "portrait retouch",
            "size": "1024*1024",
            "favorite": False,
            "createdAt": "2026-03-17T01:02:03Z",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert create_response.status_code == 200
    item_id = create_response.json()["id"]

    duplicate_response = client.post(
        "/api/v1/user/gallery",
        json={
            "clientId": "edit-task-1",
            "sourceType": "image_edit",
            "imageUrl": "https://cdn.example.com/edit-1b.jpg",
            "prompt": "portrait retouch updated",
            "size": "1024*1024",
            "favorite": True,
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert duplicate_response.status_code == 200
    assert duplicate_response.json()["id"] == item_id
    assert duplicate_response.json()["favorite"] is True

    second_response = client.post(
        "/api/v1/user/gallery",
        json={
            "clientId": "gen-task-1",
            "sourceType": "image_generation",
            "imageUrl": "https://cdn.example.com/gen-1.jpg",
            "prompt": "beach portrait",
            "size": "1080p - 9:16",
            "favorite": False,
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert second_response.status_code == 200

    list_response = client.get(
        "/api/v1/user/gallery",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert list_response.status_code == 200
    body = list_response.json()
    assert len(body) == 2
    assert body[0]["clientId"] == "edit-task-1"
    assert body[0]["favorite"] is True

    filtered_response = client.get(
        "/api/v1/user/gallery?sourceType=image_edit",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert filtered_response.status_code == 200
    assert len(filtered_response.json()) == 1
    assert filtered_response.json()[0]["sourceType"] == "image_edit"

    toggle_response = client.patch(
        f"/api/v1/user/gallery/{item_id}",
        json={"favorite": False},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert toggle_response.status_code == 200
    assert toggle_response.json()["favorite"] is False

    clear_response = client.delete(
        "/api/v1/user/gallery?sourceType=image_generation",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert clear_response.status_code == 200
    assert clear_response.json()["deleted"] == 1

    delete_response = client.delete(
        f"/api/v1/user/gallery/{item_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert delete_response.status_code == 200
    assert delete_response.json()["ok"] is True

    remaining = db_session.query(GalleryItem).filter(GalleryItem.user_id == user["id"]).all()
    assert remaining == []
