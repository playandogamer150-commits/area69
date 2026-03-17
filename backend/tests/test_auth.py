import pytest

from app.core.security import create_access_token, decode_token, get_password_hash, verify_password


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
    assert response.json()["user"]["trialEditCreditsRemaining"] == 2


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
