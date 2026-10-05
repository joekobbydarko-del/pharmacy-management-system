from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)

from sqlalchemy import func
from sqlalchemy.orm import Session

from database import SessionLocal
from inventory_models import InventoryItem
from models import User
from pos_models import POSSale, POSSaleItem
from purchase_models import Purchase
from security import decode_access_token


router = APIRouter(
    prefix="/admin/reports",
    tags=["Admin Reports"],
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


def as_float(
    value,
):
    return float(
        value or 0
    )


@router.get("/overview")
def get_report_overview(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    total_sales = (
        db.query(
            func.coalesce(
                func.sum(
                    POSSale.total_amount
                ),
                0,
            )
        )
        .filter(
            POSSale.status == "completed"
        )
        .scalar()
    )

    total_purchases = (
        db.query(
            func.coalesce(
                func.sum(
                    Purchase.total_amount
                ),
                0,
            )
        )
        .scalar()
    )

    total_transactions = (
        db.query(POSSale)
        .filter(
            POSSale.status == "completed"
        )
        .count()
    )

    total_purchase_records = (
        db.query(Purchase)
        .count()
    )

    total_inventory_units = (
        db.query(
            func.coalesce(
                func.sum(
                    InventoryItem.stock_quantity
                ),
                0,
            )
        )
        .scalar()
    )

    low_stock_items = (
        db.query(InventoryItem)
        .filter(
            InventoryItem.stock_quantity
            <=
            InventoryItem.reorder_level
        )
        .count()
    )

    gross_profit = (
        as_float(total_sales)
        -
        as_float(total_purchases)
    )

    return {
        "total_sales":
            as_float(
                total_sales
            ),

        "total_purchases":
            as_float(
                total_purchases
            ),

        "gross_profit":
            gross_profit,

        "total_transactions":
            total_transactions,

        "total_purchase_records":
            total_purchase_records,

        "inventory_units":
            int(
                total_inventory_units
                or 0
            ),

        "low_stock_items":
            low_stock_items,
    }


@router.get("/sales")
def get_sales_report(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    sales = (
        db.query(POSSale)
        .filter(
            POSSale.status == "completed"
        )
        .order_by(
            POSSale.created_at.desc()
        )
        .all()
    )

    return {
        "sales": [
            {
                "sale_number":
                    sale.sale_number,

                "customer_name":
                    sale.customer_name,

                "payment_method":
                    sale.payment_method,

                "total_amount":
                    as_float(
                        sale.total_amount
                    ),

                "amount_paid":
                    as_float(
                        sale.amount_paid
                    ),

                "change_amount":
                    as_float(
                        sale.change_amount
                    ),

                "created_at":
                    (
                        sale.created_at.isoformat()
                        if sale.created_at
                        else None
                    ),
            }
            for sale in sales
        ],

        "count":
            len(
                sales
            ),
    }


@router.get("/purchases")
def get_purchases_report(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    purchases = (
        db.query(Purchase)
        .order_by(
            Purchase.created_at.desc()
        )
        .all()
    )

    return {
        "purchases": [
            {
                "purchase_number":
                    purchase.purchase_number,

                "supplier_name":
                    purchase.supplier_name,

                "reference_number":
                    purchase.reference_number,

                "payment_status":
                    purchase.payment_status,

                "status":
                    purchase.status,

                "total_amount":
                    as_float(
                        purchase.total_amount
                    ),

                "created_at":
                    (
                        purchase.created_at.isoformat()
                        if purchase.created_at
                        else None
                    ),
            }
            for purchase in purchases
        ],

        "count":
            len(
                purchases
            ),
    }


@router.get("/inventory")
def get_inventory_report(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    items = (
        db.query(InventoryItem)
        .order_by(
            InventoryItem.drug_name.asc()
        )
        .all()
    )

    report = []

    for item in items:
        if item.stock_quantity <= 0:
            status = "Out of Stock"
        elif (
            item.stock_quantity
            <=
            item.reorder_level
        ):
            status = "Low Stock"
        else:
            status = "Healthy"

        report.append(
            {
                "drug_id":
                    item.drug_id,

                "drug_name":
                    item.drug_name,

                "stock_quantity":
                    item.stock_quantity,

                "reorder_level":
                    item.reorder_level,

                "status":
                    status,
            }
        )

    return {
        "inventory":
            report,

        "count":
            len(
                report
            ),
    }


@router.get("/top-products")
def get_top_products_report(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    rows = (
        db.query(
            POSSaleItem.drug_id,
            POSSaleItem.drug_name,
            func.sum(
                POSSaleItem.quantity
            ).label(
                "units_sold"
            ),
            func.sum(
                POSSaleItem.total_price
            ).label(
                "revenue"
            ),
        )
        .join(
            POSSale,
            POSSale.id
            ==
            POSSaleItem.sale_id,
        )
        .filter(
            POSSale.status
            ==
            "completed"
        )
        .group_by(
            POSSaleItem.drug_id,
            POSSaleItem.drug_name,
        )
        .order_by(
            func.sum(
                POSSaleItem.quantity
            ).desc()
        )
        .all()
    )

    return {
        "products": [
            {
                "drug_id":
                    row.drug_id,

                "drug_name":
                    row.drug_name,

                "units_sold":
                    int(
                        row.units_sold
                        or 0
                    ),

                "revenue":
                    as_float(
                        row.revenue
                    ),
            }
            for row in rows
        ],

        "count":
            len(
                rows
            ),
    }