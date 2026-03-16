from __future__ import annotations

from datetime import datetime
from unittest.mock import AsyncMock

from app.models.database import PaymentCharge, User


def register_and_login(client, email: str = "payer@example.com", password: str = "strongpass123") -> tuple[str, dict]:
    payload = {"email": email, "password": password, "name": "Pix User"}
    response = client.post("/api/v1/auth/register", json=payload)
    body = response.json()
    return body["access_token"], body["user"]


def test_create_pix_charge_rejects_client_amount_override(client, monkeypatch):
    token, _ = register_and_login(client)

    response = client.post(
        "/api/v1/payments/pix",
        json={"amountCents": 1},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 400
    assert "defined by the server" in response.json()["detail"]


def test_create_pix_charge_rejects_already_licensed_user(client, db_session):
    token, user = register_and_login(client)
    db_user = db_session.query(User).filter(User.id == user["id"]).first()
    assert db_user is not None
    db_user.license_status = "active"
    db_session.commit()

    response = client.post(
        "/api/v1/payments/pix",
        json={},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 409


def test_get_latest_pix_marks_underpaid_without_activating_license(client, db_session, monkeypatch):
    token, user = register_and_login(client)
    charge = PaymentCharge(
        user_id=user["id"],
        provider="efi",
        method="pix",
        status="pending",
        amount_cents=1,
        description="tiny payment",
        txid="tx-underpaid",
        created_at=datetime.utcnow(),
    )
    db_session.add(charge)
    db_session.commit()

    monkeypatch.setattr(
        "app.api.v1.endpoints.payments.EfiPixService.get_charge_status",
        AsyncMock(return_value={"status": "paid", "pix": []}),
    )

    response = client.get(
        "/api/v1/payments/pix/latest",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["charge"]["status"] == "underpaid"

    db_session.refresh(charge)
    db_user = db_session.query(User).filter(User.id == user["id"]).first()
    assert db_user is not None
    assert db_user.license_status == "inactive"


def test_webhook_revalidates_provider_status_before_activating(client, db_session, monkeypatch):
    token, user = register_and_login(client)
    charge = PaymentCharge(
        user_id=user["id"],
        provider="efi",
        method="pix",
        status="pending",
        amount_cents=4990,
        description="valid payment",
        txid="tx-valid",
        created_at=datetime.utcnow(),
    )
    db_session.add(charge)
    db_session.commit()

    monkeypatch.setattr(
        "app.api.v1.endpoints.payments.EfiPixService.get_charge_status",
        AsyncMock(return_value={"status": "pending", "pix": []}),
    )
    response = client.post("/api/v1/payments/efi/webhook", json={"pix": [{"txid": "tx-valid"}]})
    assert response.status_code == 200
    assert response.json()["updated"] == 0

    monkeypatch.setattr(
        "app.api.v1.endpoints.payments.EfiPixService.get_charge_status",
        AsyncMock(return_value={"status": "paid", "pix": []}),
    )
    response = client.post("/api/v1/payments/efi/webhook", json={"pix": [{"txid": "tx-valid"}]})

    assert response.status_code == 200
    assert response.json()["updated"] == 1

    db_session.refresh(charge)
    db_user = db_session.query(User).filter(User.id == user["id"]).first()
    assert db_user is not None
    assert charge.status == "paid"
    assert db_user.license_status == "active"


def test_efi_webhook_requires_matching_secret_when_configured(client, db_session, monkeypatch):
    monkeypatch.setattr("app.api.v1.endpoints.payments.settings.EFI_WEBHOOK_SECRET", "super-secret")
    response = client.post("/api/v1/payments/efi/webhook", json={"pix": []})

    assert response.status_code == 401

    response = client.post(
        "/api/v1/payments/efi/webhook",
        json={"pix": []},
        headers={"X-Webhook-Secret": "super-secret"},
    )

    assert response.status_code == 200
