from datetime import datetime
from decimal import Decimal

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)

from pydantic import (
    BaseModel,
    Field,
)

from sqlalchemy.orm import Session

from database import SessionLocal
from inventory_models import (
    Drug,
    InventoryItem,
)
from models import User
from purchase_models import (
    Purchase,
    PurchaseItem,
)
from security import decode_access_token


router = APIRouter(
    prefix="/admin/purchases",
    tags=["Admin Purchases"],
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

    user_id = payload.get(
        "sub"
    )

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


class PurchaseItemRequest(
    BaseModel
):
    drug_id: str

    quantity: int = Field(
        ge=1
    )

    unit_cost: float | None = Field(
        default=None,
        ge=0,
    )


class PurchaseCreateRequest(
    BaseModel
):
    supplier_name: str

    reference_number: str | None = None

    payment_status: str = "pending"

    items: list[
        PurchaseItemRequest
    ]


def money(
    value,
):
    return Decimal(
        str(
            value or 0
        )
    ).quantize(
        Decimal(
            "0.01"
        )
    )


@router.get("/drugs")
def get_purchase_drugs(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    drugs = (
        db.query(Drug)
        .order_by(
            Drug.drug_name.asc()
        )
        .all()
    )

    result = []

    for drug in drugs:
        inventory_item = (
            db.query(InventoryItem)
            .filter(
                InventoryItem.drug_id
                == drug.drug_id
            )
            .first()
        )

        result.append(
            {
                "drug_id":
                    drug.drug_id,

                "drug_name":
                    drug.drug_name,

                "category":
                    drug.category,

                "cost_price":
                    float(
                        drug.cost_price
                        or 0
                    ),

                "current_stock":
                    (
                        inventory_item.stock_quantity
                        if inventory_item
                        else drug.stock_quantity
                    ),

                "reorder_level":
                    (
                        inventory_item.reorder_level
                        if inventory_item
                        else drug.reorder_level
                    ),
            }
        )

    return {
        "drugs":
            result,

        "count":
            len(
                result
            ),
    }


@router.post("")
def create_purchase(
    request: PurchaseCreateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    supplier_name = (
        request.supplier_name
        .strip()
    )

    if not supplier_name:
        raise HTTPException(
            status_code=400,
            detail="Supplier name is required.",
        )

    if not request.items:
        raise HTTPException(
            status_code=400,
            detail="Purchase must contain at least one item.",
        )

    purchase_items_data = []

    subtotal = Decimal(
        "0.00"
    )

    try:
        for requested_item in request.items:
            drug = (
                db.query(Drug)
                .filter(
                    Drug.drug_id
                    ==
                    requested_item.drug_id
                )
                .first()
            )

            if not drug:
                raise HTTPException(
                    status_code=404,
                    detail=(
                        "Drug not found: "
                        +
                        requested_item.drug_id
                    ),
                )

            inventory_item = (
                db.query(
                    InventoryItem
                )
                .filter(
                    InventoryItem.drug_id
                    ==
                    requested_item.drug_id
                )
                .with_for_update()
                .first()
            )

            if not inventory_item:
                raise HTTPException(
                    status_code=404,
                    detail=(
                        "Inventory item not found: "
                        +
                        requested_item.drug_id
                    ),
                )

            unit_cost = money(
                requested_item.unit_cost
                if requested_item.unit_cost
                is not None
                else drug.cost_price
            )

            total_cost = money(
                unit_cost
                *
                requested_item.quantity
            )

            subtotal += total_cost

            purchase_items_data.append(
                {
                    "drug":
                        drug,

                    "inventory_item":
                        inventory_item,

                    "drug_id":
                        drug.drug_id,

                    "drug_name":
                        drug.drug_name,

                    "quantity":
                        requested_item.quantity,

                    "unit_cost":
                        unit_cost,

                    "total_cost":
                        total_cost,
                }
            )


        total_amount = money(
            subtotal
        )

        purchase = Purchase(
            purchase_number="TEMP",

            supplier_name=
                supplier_name,

            reference_number=(
                request.reference_number.strip()
                if request.reference_number
                else None
            ),

            payment_status=
                request.payment_status,

            status=
                "received",

            subtotal=
                subtotal,

            total_amount=
                total_amount,

            created_by=
                current_admin.id,

            created_at=
                datetime.utcnow(),
        )

        db.add(
            purchase
        )

        db.flush()

        purchase.purchase_number = (
            f"PUR-{purchase.id:06d}"
        )


        for item in purchase_items_data:
            purchase_item = PurchaseItem(
                purchase_id=
                    purchase.id,

                drug_id=
                    item[
                        "drug_id"
                    ],

                drug_name=
                    item[
                        "drug_name"
                    ],

                quantity=
                    item[
                        "quantity"
                    ],

                unit_cost=
                    item[
                        "unit_cost"
                    ],

                total_cost=
                    item[
                        "total_cost"
                    ],
            )

            db.add(
                purchase_item
            )


            inventory_item = item[
                "inventory_item"
            ]

            inventory_item.stock_quantity += (
                item[
                    "quantity"
                ]
            )

            inventory_item.last_updated = (
                datetime.utcnow()
            )


            drug = item[
                "drug"
            ]

            drug.stock_quantity = (
                inventory_item.stock_quantity
            )

            drug.cost_price = (
                item[
                    "unit_cost"
                ]
            )


        db.commit()

        db.refresh(
            purchase
        )


        return {
            "message":
                "Purchase recorded successfully.",

            "purchase": {
                "id":
                    purchase.id,

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

                "subtotal":
                    float(
                        purchase.subtotal
                    ),

                "total_amount":
                    float(
                        purchase.total_amount
                    ),

                "created_at":
                    (
                        purchase.created_at
                        .isoformat()
                        if purchase.created_at
                        else None
                    ),

                "items":
                    [
                        {
                            "drug_id":
                                item[
                                    "drug_id"
                                ],

                            "drug_name":
                                item[
                                    "drug_name"
                                ],

                            "quantity":
                                item[
                                    "quantity"
                                ],

                            "unit_cost":
                                float(
                                    item[
                                        "unit_cost"
                                    ]
                                ),

                            "total_cost":
                                float(
                                    item[
                                        "total_cost"
                                    ]
                                ),
                        }

                        for item
                        in purchase_items_data
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
                "Purchase creation failed: "
                +
                str(
                    error
                )
            ),
        )


@router.get("")
def get_purchases(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    purchases = (
        db.query(Purchase)
        .order_by(
            Purchase.created_at.desc()
        )
        .limit(
            100
        )
        .all()
    )

    result = []

    for purchase in purchases:
        result.append(
            {
                "id":
                    purchase.id,

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
                    float(
                        purchase.total_amount
                    ),

                "item_count":
                    len(
                        purchase.items
                    ),

                "created_at":
                    (
                        purchase.created_at
                        .isoformat()
                        if purchase.created_at
                        else None
                    ),
            }
        )

    return {
        "purchases":
            result,

        "count":
            len(
                result
            ),
    }