from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import SessionLocal
from inventory_models import Drug, InventoryItem
from models import User
from pos_models import POSSale, POSSaleItem
from security import decode_access_token


router = APIRouter(
    prefix="/admin/pos",
    tags=["Admin POS"],
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
    token = credentials.credentials

    payload = decode_access_token(token)

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


class POSItemRequest(BaseModel):
    drug_id: str

    quantity: int = Field(
        ge=1
    )


class POSSaleRequest(BaseModel):
    customer_name: str | None = None

    customer_type: str = "walk_in"

    patient_id: int | None = None

    payment_method: str = "cash"

    amount_paid: float = 0

    items: list[POSItemRequest]


def money(value):
    return Decimal(
        str(
            value or 0
        )
    ).quantize(
        Decimal("0.01")
    )


@router.get("/products")
def get_pos_products(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    inventory_rows = (
        db.query(InventoryItem)
        .order_by(
            InventoryItem.drug_name.asc()
        )
        .all()
    )

    products = []

    for inventory_item in inventory_rows:
        drug = (
            db.query(Drug)
            .filter(
                Drug.drug_id
                == inventory_item.drug_id
            )
            .first()
        )

        if inventory_item.stock_quantity <= 0:
            status = "Out of Stock"

        elif (
            inventory_item.stock_quantity
            <= inventory_item.reorder_level
        ):
            status = "Low Stock"

        else:
            status = "Healthy"

        products.append(
            {
                "drug_id": inventory_item.drug_id,
                "drug_name": inventory_item.drug_name,
                "category": (
                    drug.category
                    if drug
                    else None
                ),
                "price": float(
                    (
                        drug.one_time_price
                        if drug
                        else 0
                    )
                    or 0
                ),
                "monthly_price": float(
                    (
                        drug.monthly_price
                        if drug
                        else 0
                    )
                    or 0
                ),
                "stock_quantity": (
                    inventory_item.stock_quantity
                ),
                "reorder_level": (
                    inventory_item.reorder_level
                ),
                "status": status,
            }
        )

    return {
        "products": products,
        "count": len(products),
    }


@router.post("/checkout")
def checkout_pos_sale(
    request: POSSaleRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    if not request.items:
        raise HTTPException(
            status_code=400,
            detail="Cart is empty.",
        )

    sale_items_data = []

    subtotal = Decimal("0.00")

    try:
        for requested_item in request.items:
            inventory_item = (
                db.query(InventoryItem)
                .filter(
                    InventoryItem.drug_id
                    == requested_item.drug_id
                )
                .with_for_update()
                .first()
            )

            if not inventory_item:
                raise HTTPException(
                    status_code=404,
                    detail=(
                        "Inventory item not found for "
                        + requested_item.drug_id
                    ),
                )

            drug = (
                db.query(Drug)
                .filter(
                    Drug.drug_id
                    == requested_item.drug_id
                )
                .first()
            )

            if not drug:
                raise HTTPException(
                    status_code=404,
                    detail=(
                        "Drug pricing not found for "
                        + requested_item.drug_id
                    ),
                )

            if (
                inventory_item.stock_quantity
                < requested_item.quantity
            ):
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Not enough stock for "
                        + inventory_item.drug_name
                    ),
                )

            unit_price = money(
                drug.one_time_price
            )

            line_total = money(
                unit_price
                * requested_item.quantity
            )

            subtotal += line_total

            sale_items_data.append(
                {
                    "inventory_item": inventory_item,
                    "drug_id": requested_item.drug_id,
                    "drug_name": inventory_item.drug_name,
                    "quantity": requested_item.quantity,
                    "unit_price": unit_price,
                    "total_price": line_total,
                }
            )

        total_amount = money(
            subtotal
        )

        amount_paid = money(
            request.amount_paid
        )

        if amount_paid < total_amount:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Amount paid is less than total amount."
                ),
            )

        change_amount = money(
            amount_paid
            - total_amount
        )

        sale = POSSale(
            sale_number="TEMP",
            customer_name=(
                request.customer_name
                or "Walk-in Customer"
            ),
            customer_type=request.customer_type,
            patient_id=request.patient_id,
            payment_method=request.payment_method,
            subtotal=subtotal,
            total_amount=total_amount,
            amount_paid=amount_paid,
            change_amount=change_amount,
            status="completed",
            sold_by=current_admin.id,
            created_at=datetime.utcnow(),
        )

        db.add(sale)

        db.flush()

        sale.sale_number = (
            f"POS-{sale.id:06d}"
        )

        for item in sale_items_data:
            sale_item = POSSaleItem(
                sale_id=sale.id,
                drug_id=item["drug_id"],
                drug_name=item["drug_name"],
                quantity=item["quantity"],
                unit_price=item["unit_price"],
                total_price=item["total_price"],
            )

            db.add(sale_item)

            item[
                "inventory_item"
            ].stock_quantity -= (
                item["quantity"]
            )

        db.commit()

        db.refresh(sale)

        return {
            "message": (
                "POS sale completed successfully."
            ),
            "sale": {
                "id": sale.id,
                "sale_number": sale.sale_number,
                "customer_name": sale.customer_name,
                "payment_method": sale.payment_method,
                "subtotal": float(
                    sale.subtotal
                ),
                "total_amount": float(
                    sale.total_amount
                ),
                "amount_paid": float(
                    sale.amount_paid
                ),
                "change_amount": float(
                    sale.change_amount
                ),
                "status": sale.status,
                "created_at": (
                    sale.created_at.isoformat()
                    if sale.created_at
                    else None
                ),
                "items": [
                    {
                        "drug_id": item["drug_id"],
                        "drug_name": item["drug_name"],
                        "quantity": item["quantity"],
                        "unit_price": float(
                            item["unit_price"]
                        ),
                        "total_price": float(
                            item["total_price"]
                        ),
                    }
                    for item
                    in sale_items_data
                ],
            },
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "POS checkout failed: "
                + str(error)
            ),
        )


@router.get("/sales")
def get_pos_sales(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    sales = (
        db.query(POSSale)
        .order_by(
            POSSale.created_at.desc()
        )
        .limit(100)
        .all()
    )

    result = []

    for sale in sales:
        result.append(
            {
                "id": sale.id,
                "sale_number": sale.sale_number,
                "customer_name": sale.customer_name,
                "payment_method": sale.payment_method,
                "total_amount": float(
                    sale.total_amount
                ),
                "amount_paid": float(
                    sale.amount_paid
                ),
                "change_amount": float(
                    sale.change_amount
                ),
                "status": sale.status,
                "created_at": (
                    sale.created_at.isoformat()
                    if sale.created_at
                    else None
                ),
                "item_count": len(
                    sale.items
                ),
            }
        )

    return {
        "sales": result,
        "count": len(result),
    }