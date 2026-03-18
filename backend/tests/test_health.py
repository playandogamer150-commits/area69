from __future__ import annotations

from unittest.mock import AsyncMock
import httpx

from app.api.v1.endpoints.health import _check_http_provider


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


class _FakeAsyncClient:
    def __init__(self, status_code: int):
        self.status_code = status_code

    async def get(self, path: str, headers: dict[str, str]):
        request = httpx.Request("GET", f"https://example.test{path}", headers=headers)
        return httpx.Response(self.status_code, request=request)


def _run(coro):
    import asyncio

    return asyncio.run(coro)


def test_http_provider_health_rejects_unexpected_4xx():
    result = _run(
        _check_http_provider(
            configured=True,
            name="WaveSpeed",
            client=_FakeAsyncClient(400),
            path="/predictions/does-not-matter",
            headers={},
            allowed_status_codes={200, 404},
        )
    )

    assert result["status"] == "error"
    assert result["detail"] == "unexpected_status:400"


def test_http_provider_health_accepts_expected_404():
    result = _run(
        _check_http_provider(
            configured=True,
            name="Higgsfield",
            client=_FakeAsyncClient(404),
            path="/requests/does-not-matter/status",
            headers={},
            allowed_status_codes={200, 404},
        )
    )

    assert result["status"] == "ok"
    assert result["detail"] == "reachable"
