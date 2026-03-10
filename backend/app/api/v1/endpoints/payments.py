from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.security import get_current_user
from app.models.database import LicenseKey, PaymentCharge, User, get_db
from app.services.efi_pix_service import EfiPixService

router = APIRouter(prefix="/payments", tags=["Payments"])
settings = Settings()


class CreatePixChargeRequest(BaseModel):
    amountCents: int | None = Field(default=None, ge=1)
    description: str | None = None


def serialize_charge(charge: PaymentCharge) -> dict:
    return {
        "id": charge.id,
        "provider": charge.provider,
        "method": charge.method,
        "status": charge.status,
        "amountCents": charge.amount_cents,
        "description": charge.description,
        "txid": charge.txid,
        "pixCopyPaste": charge.pix_copy_paste,
        "qrCodeImage": charge.qr_code_image,
        "expiresAt": charge.expires_at.isoformat() if charge.expires_at else None,
        "paidAt": charge.paid_at.isoformat() if charge.paid_at else None,
        "createdAt": charge.created_at.isoformat() if charge.created_at else None,
    }


def _auto_activate_user_after_payment(db: Session, user: User) -> None:
    if (user.license_status or "inactive") == "active":
        return

    license_key = (
        db.query(LicenseKey)
        .filter(LicenseKey.is_active == True, LicenseKey.assigned_user_id.is_(None))
        .order_by(LicenseKey.created_at.asc())
        .first()
    )

    now = datetime.utcnow()
    if not license_key:
        generated = f"AREA69-{uuid4().hex[:5].upper()}-{uuid4().hex[:5].upper()}-{uuid4().hex[:5].upper()}-{uuid4().hex[:5].upper()}"
        license_key = LicenseKey(
            key=generated,
            plan_name="lifetime",
            is_active=True,
            max_activations=1,
            activations_count=0,
        )
        db.add(license_key)
        db.flush()

    license_key.assigned_user_id = user.id
    license_key.activations_count = max(license_key.activations_count or 0, 0) + 1
    license_key.activated_at = now

    user.license_key = license_key.key
    user.license_status = "active"
    user.license_plan = license_key.plan_name or "lifetime"
    user.license_activated_at = now
    user.license_expires_at = license_key.expires_at


@router.post("/pix")
async def create_pix_charge(
    payload: CreatePixChargeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = EfiPixService(settings)
    amount_cents = payload.amountCents or settings.PIX_DEFAULT_AMOUNT_CENTS
    description = (payload.description or "Ativacao de acesso AREA 69 via Pix").strip()

    try:
        charge_data = await service.create_pix_charge(
            amount_cents=amount_cents,
            payer_name=current_user.name,
            payer_email=current_user.email,
            description=description,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except Exception as exc:
        detail = str(exc)
        response = getattr(exc, "response", None)
        if response is not None:
            try:
                detail = response.text
            except Exception:
                detail = str(exc)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Falha ao criar cobranca Pix na Efi: {detail}") from exc

    charge = PaymentCharge(
        user_id=current_user.id,
        provider=charge_data["provider"],
        method=charge_data["method"],
        status=charge_data["status"],
        amount_cents=amount_cents,
        description=description,
        external_id=charge_data.get("external_id"),
        txid=charge_data.get("txid"),
        pix_copy_paste=charge_data.get("pix_copy_paste"),
        qr_code_image=charge_data.get("qr_code_image"),
        expires_at=charge_data.get("expires_at"),
    )
    db.add(charge)
    db.commit()
    db.refresh(charge)
    return serialize_charge(charge)


@router.get("/pix/latest")
async def get_latest_pix_charge(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    charge = (
        db.query(PaymentCharge)
        .filter(PaymentCharge.user_id == current_user.id, PaymentCharge.method == "pix")
        .order_by(PaymentCharge.created_at.desc())
        .first()
    )
    if not charge:
        return {"charge": None}

    if charge.txid and charge.status not in {"paid", "concluida"}:
        try:
            status_data = await EfiPixService(settings).get_charge_status(charge.txid)
            charge.status = status_data["status"]
            if charge.status in {"concluida", "paid"}:
                charge.paid_at = charge.paid_at or datetime.utcnow()
                _auto_activate_user_after_payment(db, current_user)
            db.commit()
            db.refresh(charge)
        except Exception:
            db.rollback()

    return {"charge": serialize_charge(charge)}


@router.post("/efi/webhook")
async def efi_webhook(payload: dict, db: Session = Depends(get_db)):
    pix_items = payload.get("pix") or []
    updated = 0

    for item in pix_items:
        txid = item.get("txid")
        if not txid:
            continue

        charge = db.query(PaymentCharge).filter(PaymentCharge.txid == txid).first()
        if not charge:
            continue

        charge.status = "paid"
        charge.paid_at = charge.paid_at or datetime.utcnow()
        user = db.query(User).filter(User.id == charge.user_id).first()
        if user:
            _auto_activate_user_after_payment(db, user)
        updated += 1

    if updated:
        db.commit()

    return {"ok": True, "updated": updated}
