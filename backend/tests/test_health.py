from __future__ import annotations

from unittest.mock import AsyncMock


def test_liveness_health_endpoint(client):
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "timestamp" in body


def test_readiness_returns_200_when_all_critical_checks_pass(client, monkeypatch):
    ok_check = {"status": "ok", "critical": True, "latencyMs": 1.0}
    monkeypatch.setattr("app.api.v1.endpoints.health.check_database_health", AsyncMock(return_value=ok_check))
    monkeypatch.setattr("app.api.v1.endpoints.health.check_r2_health", AsyncMock(return_value=ok_check))
    monkeypatch.setattr("app.api.v1.endpoints.health.check_higgsfield_health", AsyncMock(return_value=ok_check))
    monkeypatch.setattr("app.api.v1.endpoints.health.check_wavespeed_health", AsyncMock(return_value=ok_check))
    monkeypatch.setattr(
        "app.api.v1.endpoints.health.check_processing_mode",
        lambda: {"status": "ok", "critical": False, "mode": "synchronous", "brokerConfigured": True},
    )

    response = client.get("/api/v1/health/ready")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["ready"] is True
    assert body["checks"]["generation"]["higgsfield"]["status"] == "ok"


def test_readiness_returns_503_when_a_critical_check_fails(client, monkeypatch):
    ok_check = {"status": "ok", "critical": True, "latencyMs": 1.0}
    failing_check = {"status": "error", "critical": True, "latencyMs": 2.0, "detail": "missing_config"}
    monkeypatch.setattr("app.api.v1.endpoints.health.check_database_health", AsyncMock(return_value=ok_check))
    monkeypatch.setattr("app.api.v1.endpoints.health.check_r2_health", AsyncMock(return_value=failing_check))
    monkeypatch.setattr("app.api.v1.endpoints.health.check_higgsfield_health", AsyncMock(return_value=ok_check))
    monkeypatch.setattr("app.api.v1.endpoints.health.check_wavespeed_health", AsyncMock(return_value=ok_check))
    monkeypatch.setattr(
        "app.api.v1.endpoints.health.check_processing_mode",
        lambda: {"status": "ok", "critical": False, "mode": "synchronous", "brokerConfigured": True},
    )

    response = client.get("/api/v1/health/ready")

    assert response.status_code == 503
    body = response.json()
    assert body["status"] == "error"
    assert body["ready"] is False
    assert body["checks"]["storage"]["detail"] == "missing_config"
