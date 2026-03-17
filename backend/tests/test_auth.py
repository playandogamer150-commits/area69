from datetime import datetime
from unittest.mock import AsyncMock

from app.core.anti_abuse import determine_trial_block_reason
from app.core.security import create_access_token, decode_token, get_password_hash, verify_password
from app.models.database import User


def test_password_hashing():
    """Test password hashing and verification."""
    password = "testpassword123"
    hashed = get_password_hash(password)
    
    assert verify_password(password, hashed)
    assert not verify_password("wrongpassword", hashed)


def test_create_access_token():
    """Test JWT token creation."""
    data = {"sub": "1"}
    token = create_access_token(data)
    
    assert isinstance(token, str)
    assert len(token) > 0


def test_decode_token_valid():
    """Test token decoding with valid token."""
    data = {"sub": "1"}
    token = create_access_token(data)
    
    payload = decode_token(token)
    
    assert payload is not None
    assert payload.get("sub") == "1"


def test_decode_token_invalid():
    """Test token decoding with invalid token."""
    payload = decode_token("invalid_token")
    
    assert payload is None


def test_register_user(client, test_user_data):
    """Test user registration."""
    response = client.post("/api/v1/auth/register", json=test_user_data)
    
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["user"]["email"] == test_user_data["email"]
    assert response.json()["user"]["authProvider"] == "password"
    assert response.json()["user"]["trialEditCreditsRemaining"] == 0
    assert response.json()["user"]["trialBlockedReason"] == "social_login_required"


def test_register_duplicate_email(client, test_user_data):
    """Test registration with duplicate email."""
    client.post("/api/v1/auth/register", json=test_user_data)
    
    response = client.post("/api/v1/auth/register", json=test_user_data)
    
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


def test_login_success(client, test_user_data):
    """Test successful login."""
    client.post("/api/v1/auth/register", json=test_user_data)
    
    response = client.post("/api/v1/auth/login", json={
        "email": test_user_data["email"],
        "password": test_user_data["password"],
    })
    
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert "refresh_token" in response.json()
    assert response.json()["token_type"] == "bearer"


def test_login_normalizes_email(client, test_user_data):
    client.post("/api/v1/auth/register", json=test_user_data)

    response = client.post("/api/v1/auth/login", json={
        "email": "  TEST@EXAMPLE.COM  ",
        "password": test_user_data["password"],
    })

    assert response.status_code == 200
    assert response.json()["user"]["email"] == test_user_data["email"]


def test_login_wrong_password(client, test_user_data):
    """Test login with wrong password."""
    client.post("/api/v1/auth/register", json=test_user_data)
    
    response = client.post("/api/v1/auth/login", json={
        "email": test_user_data["email"],
        "password": "wrongpassword",
    })
    
    assert response.status_code == 401


def test_login_nonexistent_user(client):
    """Test login with nonexistent user."""
    response = client.post("/api/v1/auth/login", json={
        "email": "nonexistent@example.com",
        "password": "password",
    })
    
    assert response.status_code == 401


def test_get_current_user(client, test_user_data):
    """Test getting current user info."""
    client.post("/api/v1/auth/register", json=test_user_data)
    
    login_response = client.post("/api/v1/auth/login", json={
        "email": test_user_data["email"],
        "password": test_user_data["password"],
    })
    
    token = login_response.json()["access_token"]
    
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    assert response.json()["email"] == test_user_data["email"]


def test_unauthorized_access(client):
    """Test accessing protected endpoint without token."""
    response = client.get("/api/v1/auth/me")
    
    assert response.status_code == 401


def test_refresh_token_cannot_access_protected_endpoints(client, test_user_data):
    register_response = client.post("/api/v1/auth/register", json=test_user_data)
    refresh_token = register_response.json()["refresh_token"]

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {refresh_token}"}
    )

    assert response.status_code == 401


def test_register_rejects_short_password(client, test_user_data):
    payload = {**test_user_data, "password": "short"}

    response = client.post("/api/v1/auth/register", json=payload)

    assert response.status_code == 422


def test_register_rejects_disposable_email_domain(client, test_user_data):
    payload = {**test_user_data, "email": "temp@mailinator.com"}

    response = client.post("/api/v1/auth/register", json=payload)

    assert response.status_code == 400
    assert response.json()["detail"] == "Disposable email addresses are not allowed"


def test_password_signup_never_receives_trial_even_with_clean_email(client, test_user_data):
    response = client.post("/api/v1/auth/register", json=test_user_data)

    assert response.status_code == 200
    assert response.json()["user"]["trialEditCreditsRemaining"] == 0
    assert response.json()["user"]["trialBlockedReason"] == "social_login_required"


def test_social_trial_policy_blocks_reused_device_fingerprint(db_session):
    db_session.add(
        User(
            email="google-user@example.com",
            hashed_password="hash",
            auth_provider="google",
            device_fingerprint_hash="same-device",
            signup_ip_hash="ip-a",
            trial_granted_at=datetime.utcnow(),
        )
    )
    db_session.commit()

    reason = determine_trial_block_reason(
        db_session,
        auth_provider="google",
        signup_ip_hash="ip-b",
        device_fingerprint_hash="same-device",
    )

    assert reason == "device_limit"


def test_social_trial_policy_requires_device_fingerprint(db_session):
    reason = determine_trial_block_reason(
        db_session,
        auth_provider="google",
        signup_ip_hash="ip-a",
        device_fingerprint_hash=None,
    )

    assert reason == "missing_fingerprint"


def test_social_trial_policy_blocks_trial_when_ip_limit_is_reached(db_session, monkeypatch):
    monkeypatch.setattr("app.core.anti_abuse.settings.TRIAL_MAX_ACCOUNTS_PER_IP", 1)
    db_session.add(
        User(
            email="google-user@example.com",
            hashed_password="hash",
            auth_provider="google",
            device_fingerprint_hash="device-a",
            signup_ip_hash="same-ip",
            trial_granted_at=datetime.utcnow(),
        )
    )
    db_session.commit()

    reason = determine_trial_block_reason(
        db_session,
        auth_provider="google",
        signup_ip_hash="same-ip",
        device_fingerprint_hash="device-b",
    )

    assert reason == "ip_limit"


def test_social_trial_policy_requires_social_provider(db_session):
    reason = determine_trial_block_reason(
        db_session,
        auth_provider="password",
        signup_ip_hash="same-ip",
        device_fingerprint_hash="device-a",
    )

    assert reason == "social_login_required"


def test_register_requires_valid_turnstile_when_secret_is_configured(client, monkeypatch, test_user_data):
    monkeypatch.setattr("app.api.v1.endpoints.auth.settings.TURNSTILE_SECRET_KEY", "turnstile-secret")

    response = client.post("/api/v1/auth/register", json=test_user_data)

    assert response.status_code == 400
    assert response.json()["detail"] == "Turnstile token is required"


def test_register_rejects_invalid_turnstile_token(client, monkeypatch, test_user_data):
    monkeypatch.setattr("app.api.v1.endpoints.auth.settings.TURNSTILE_SECRET_KEY", "turnstile-secret")
    monkeypatch.setattr(
        "app.api.v1.endpoints.auth.verify_turnstile_token",
        AsyncMock(return_value=False),
    )

    response = client.post(
        "/api/v1/auth/register",
        json={**test_user_data, "turnstileToken": "invalid-token"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Turnstile verification failed"
