from __future__ import annotations

import httpx

from app.core.config import settings


class SmsVerificationError(RuntimeError):
    pass


def _service_url(path: str) -> str:
    if not settings.sms_verification_configured:
        raise SmsVerificationError("SMS verification provider is not configured")
    return f"{settings.TWILIO_VERIFY_BASE_URL.rstrip('/')}/Services/{settings.TWILIO_VERIFY_SERVICE_SID}/{path.lstrip('/')}"


async def send_sms_verification_code(phone_number: str) -> None:
    payload = {"To": phone_number, "Channel": "sms"}
    async with httpx.AsyncClient(timeout=15.0, auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)) as client:
        response = await client.post(_service_url("Verifications"), data=payload)
        response.raise_for_status()
        data = response.json()
    if data.get("status") != "pending":
        raise SmsVerificationError("SMS verification could not be started")


async def check_sms_verification_code(phone_number: str, code: str) -> bool:
    payload = {"To": phone_number, "Code": code}
    async with httpx.AsyncClient(timeout=15.0, auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)) as client:
        response = await client.post(_service_url("VerificationCheck"), data=payload)
        response.raise_for_status()
        data = response.json()
    return data.get("status") == "approved"
