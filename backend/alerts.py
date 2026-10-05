from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)

from sqlalchemy.orm import Session

from database import SessionLocal
from inventory_models import InventoryItem
from models import User
from purchase_models import Purchase
from pos_models import POSSale
from security import decode_access_token


router = APIRouter(
    prefix="/admin/alerts",
    tags=["Admin Alerts"],
)

security = HTTPBearer()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    payload = decode_access_token(
        credentials.credentials
    )

    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token.",
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid token payload.",
        )

    user = (
        db.query(User)
        .filter(
            User.id == int(user_id)
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive.",
        )

    role = str(
        user.role or ""
    ).strip().lower()

    if role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Administrator access required.",
        )

    return user


@router.get("")
def get_admin_alerts(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    alerts = []

    inventory_items = (
        db.query(InventoryItem)
        .order_by(
            InventoryItem.drug_name.asc()
        )
        .all()
    )

    for item in inventory_items:
        if item.stock_quantity <= 0:
            alerts.append(
                {
                    "type": "inventory",
                    "severity": "critical",
                    "title": "Out of Stock",
                    "message": (
                        f"{item.drug_name} is out of stock."
                    ),
                    "drug_id": item.drug_id,
                }
            )

        elif (
            item.stock_quantity
            <= item.reorder_level
        ):
            alerts.append(
                {
                    "type": "inventory",
                    "severity": "warning",
                    "title": "Low Stock",
                    "message": (
                        f"{item.drug_name} is low on stock "
                        f"({item.stock_quantity} remaining)."
                    ),
                    "drug_id": item.drug_id,
                }
            )

    recent_sale = (
        db.query(POSSale)
        .order_by(
            POSSale.created_at.desc()
        )
        .first()
    )

    if recent_sale:
        alerts.append(
            {
                "type": "sales",
                "severity": "info",
                "title": "Latest Sale",
                "message": (
                    f"{recent_sale.sale_number} completed "
                    f"for GHS {float(recent_sale.total_amount):.2f}."
                ),
                "created_at": (
                    recent_sale.created_at.isoformat()
                    if recent_sale.created_at
                    else None
                ),
            }
        )

    recent_purchase = (
        db.query(Purchase)
        .order_by(
            Purchase.created_at.desc()
        )
        .first()
    )

    if recent_purchase:
        alerts.append(
            {
                "type": "purchase",
                "severity": "info",
                "title": "Latest Purchase",
                "message": (
                    f"{recent_purchase.purchase_number} received "
                    f"from {recent_purchase.supplier_name}."
                ),
                "created_at": (
                    recent_purchase.created_at.isoformat()
                    if recent_purchase.created_at
                    else None
                ),
            }
        )

    return {
        "alerts": alerts,
        "count": len(alerts),
        "critical_count": len(
            [
                item
                for item in alerts
                if item["severity"] == "critical"
            ]
        ),
        "warning_count": len(
            [
                item
                for item in alerts
                if item["severity"] == "warning"
            ]
        ),
    }