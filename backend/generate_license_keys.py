from __future__ import annotations

import secrets
import string
import sys

from app.models.database import LicenseKey, SessionLocal


def make_key(prefix: str = "AREA69") -> str:
    alphabet = string.ascii_uppercase + string.digits
    parts = ["".join(secrets.choice(alphabet) for _ in range(5)) for _ in range(4)]
    return f"{prefix}-" + "-".join(parts)


def main() -> None:
    quantity = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    plan = sys.argv[2] if len(sys.argv) > 2 else "lifetime"

    db = SessionLocal()
    try:
        generated: list[str] = []
        for _ in range(quantity):
            key = make_key()
            while db.query(LicenseKey).filter(LicenseKey.key == key).first():
                key = make_key()
            db.add(LicenseKey(key=key, plan_name=plan, is_active=True, max_activations=1))
            generated.append(key)
        db.commit()
        print("\n".join(generated))
    finally:
        db.close()


if __name__ == "__main__":
    main()
