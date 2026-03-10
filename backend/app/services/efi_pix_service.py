from __future__ import annotations

import base64
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import httpx
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.serialization import pkcs12

from app.core.config import Settings, settings as app_settings

logger = logging.getLogger(__name__)


class EfiPixService:
    def __init__(self, settings: Settings | None = None):
        self.settings = settings or app_settings
        self.base_url = "https://pix-h.api.efipay.com.br" if self.settings.EFI_SANDBOX else "https://pix.api.efipay.com.br"

    def is_configured(self) -> bool:
        return bool(
            self.settings.EFI_CLIENT_ID
            and self.settings.EFI_CLIENT_SECRET
            and self.settings.EFI_PIX_KEY
            and (self.settings.EFI_CERT_PATH or self.settings.EFI_CERT_BASE64)
        )

    def _cert_path(self) -> str:
        cert_source = self.settings.EFI_CERT_PATH
        if not cert_source and self.settings.EFI_CERT_BASE64:
            cert_dir = Path("./backend/.certs")
            cert_dir.mkdir(parents=True, exist_ok=True)
            suffix = ".p12"
            cert_source = str(cert_dir / f"efi-cert{suffix}")
            Path(cert_source).write_bytes(base64.b64decode(self.settings.EFI_CERT_BASE64))

        if not cert_source:
            raise RuntimeError("EFI certificate not configured")

        source_path = Path(cert_source)
        if source_path.suffix.lower() not in {".p12", ".pfx"}:
            return str(source_path)

        cert_dir = Path("./backend/.certs")
        cert_dir.mkdir(parents=True, exist_ok=True)
        pem_path = cert_dir / "efi-cert.pem"
        p12_bytes = source_path.read_bytes()
        private_key, certificate, additional_certificates = pkcs12.load_key_and_certificates(
            p12_bytes,
            self.settings.EFI_CERT_PASSWORD.encode("utf-8") if self.settings.EFI_CERT_PASSWORD else None,
        )
        if private_key is None or certificate is None:
            raise RuntimeError("Could not extract certificate data from EFI P12 file")

        pem_chunks = [
            private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.TraditionalOpenSSL,
                encryption_algorithm=serialization.NoEncryption(),
            ),
            certificate.public_bytes(serialization.Encoding.PEM),
        ]
        for extra_cert in additional_certificates or []:
            pem_chunks.append(extra_cert.public_bytes(serialization.Encoding.PEM))

        pem_path.write_bytes(b"".join(pem_chunks))
        return str(pem_path)

    async def _token(self) -> str:
        auth = base64.b64encode(
            f"{self.settings.EFI_CLIENT_ID}:{self.settings.EFI_CLIENT_SECRET}".encode("utf-8")
        ).decode("utf-8")
        async with httpx.AsyncClient(cert=self._cert_path(), timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/oauth/token",
                headers={
                    "Authorization": f"Basic {auth}",
                    "Content-Type": "application/json",
                },
                json={"grant_type": "client_credentials"},
            )
            try:
                response.raise_for_status()
            except httpx.HTTPStatusError as exc:
                logger.exception("Efi OAuth error: %s", response.text)
                raise RuntimeError(f"OAuth Efi falhou ({response.status_code}): {response.text}") from exc
            return response.json()["access_token"]

    async def create_pix_charge(self, *, amount_cents: int, payer_name: str | None, payer_email: str, description: str) -> dict[str, Any]:
        if not self.is_configured():
            raise RuntimeError("EFI Pix credentials are incomplete. Configure client id, secret, Pix key and certificate.")

        token = await self._token()
        amount = f"{amount_cents / 100:.2f}"
        expires_at = datetime.utcnow() + timedelta(hours=1)

        async with httpx.AsyncClient(cert=self._cert_path(), timeout=30.0) as client:
            payload = {
                "calendario": {"expiracao": 3600},
                "valor": {"original": amount},
                "chave": self.settings.EFI_PIX_KEY,
                "solicitacaoPagador": description,
            }
            response = await client.post(
                f"{self.base_url}/v2/cob",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            try:
                response.raise_for_status()
            except httpx.HTTPStatusError as exc:
                logger.exception("Efi charge creation error: %s", response.text)
                raise RuntimeError(f"Criacao de cobranca falhou ({response.status_code}): {response.text}") from exc
            data = response.json()
            return {
                "provider": "efi",
                "method": "pix",
                "status": str(data.get("status", "ATIVA")).lower(),
                "external_id": str(data.get("loc", {}).get("id") or data.get("txid")),
                "txid": data.get("txid"),
                "pix_copy_paste": data.get("pixCopiaECola"),
                "qr_code_image": data.get("imagemQrcode"),
                "expires_at": expires_at,
                "raw": data,
            }

    async def get_charge_status(self, txid: str) -> dict[str, Any]:
        token = await self._token()
        async with httpx.AsyncClient(cert=self._cert_path(), timeout=30.0) as client:
            response = await client.get(
                f"{self.base_url}/v2/cob/{txid}",
                headers={"Authorization": f"Bearer {token}"},
            )
            try:
                response.raise_for_status()
            except httpx.HTTPStatusError as exc:
                logger.exception("Efi charge status error: %s", response.text)
                raise RuntimeError(f"Consulta de cobranca falhou ({response.status_code}): {response.text}") from exc
            data = response.json()
            return {
                "status": str(data.get("status", "ATIVA")).lower(),
                "pix": data.get("pix") or [],
                "raw": data,
            }
