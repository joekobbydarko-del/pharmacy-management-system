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

from inventory_sync import (
    create_google_admin_pos_checkout,
    get_google_admin_pos_products,
    get_google_admin_pos_sales,
)

from models import User
from security import decode_access_token


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/admin/pos",
    tags=["Admin POS"],
)


security = HTTPBearer()


# ============================================================
# DATABASE
#
# Local PostgreSQL is used here ONLY for authentication.
# POS sales/inventory/order data now comes from Google Sheets.
# ============================================================

def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ============================================================
# ADMIN AUTHENTICATION
# ============================================================

def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(
        get_db
    ),
):
    token = (
        credentials.credentials
    )

    payload = (
        decode_access_token(
            token
        )
    )

    if not payload:
        raise HTTPException(
            status_code=401,
            detail=
                "Invalid or expired token.",
        )

    user_id = (
        payload.get(
            "sub"
        )
    )

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail=
                "Invalid token payload.",
        )

    try:
        numeric_user_id = int(
            user_id
        )

    except (
        TypeError,
        ValueError,
    ):
        raise HTTPException(
            status_code=401,
            detail=
                "Invalid token payload.",
        )

    user = (
        db.query(
            User
        )
        .filter(
            User.id ==
            numeric_user_id
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail=
                "User not found.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail=
                "User account is inactive.",
        )

    role = str(
        user.role or ""
    ).strip().lower()

    if role != "admin":
        raise HTTPException(
            status_code=403,
            detail=
                "Administrator access required.",
        )

    return user


# ============================================================
# REQUEST MODELS
# ============================================================

class POSItemRequest(
    BaseModel
):
    drug_id: str

    quantity: int = Field(
        ge=1
    )


class POSSaleRequest(
    BaseModel
):
    """
    Dr. Evans Pharmacy is a remote/delivery pharmacy.

    Every POS order belongs to an existing registered patient.

    customer_name/customer_type are intentionally kept optional
    for temporary frontend compatibility, but Google Apps Script
    does NOT trust them.

    The authoritative patient and customer type are loaded from
    the real Patients sheet using patient_id.
    """

    patient_id: str

    customer_name: str | None = None

    customer_type: str | None = None

    payment_method: str = "cash"

    amount_paid: float = Field(
        ge=0
    )

    items: list[
        POSItemRequest
    ]


# ============================================================
# PAYLOAD NORMALIZATION
# ============================================================

def normalize_text(
    value,
):
    return str(
        value
        if value is not None
        else ""
    ).strip()


def build_google_checkout_payload(
    request: POSSaleRequest,
):
    patient_id = (
        normalize_text(
            request.patient_id
        )
    )

    if not patient_id:
        raise HTTPException(
            status_code=400,
            detail=
                "Please select a registered patient.",
        )

    if not request.items:
        raise HTTPException(
            status_code=400,
            detail=
                "Cart is empty.",
        )

    normalized_items = []

    for item in request.items:
        drug_id = (
            normalize_text(
                item.drug_id
            )
        )

        if not drug_id:
            raise HTTPException(
                status_code=400,
                detail=
                    "Every cart item must contain a Drug ID.",
            )

        normalized_items.append(
            {
                "drug_id":
                    drug_id,

                "quantity":
                    int(
                        item.quantity
                    ),
            }
        )

    payment_method = (
        normalize_text(
            request.payment_method
        )
        or "cash"
    )

    return {
        "patient_id":
            patient_id,

        "payment_method":
            payment_method,

        "amount_paid":
            float(
                request.amount_paid
            ),

        "items":
            normalized_items,
    }


# ============================================================
# GOOGLE ERROR HELPERS
# ============================================================

def google_service_error(
    error,
    default_message,
):
    message = str(
        error or ""
    ).strip()

    if not message:
        message = (
            default_message
        )

    return HTTPException(
        status_code=502,
        detail=message,
    )


def google_checkout_error(
    error,
):
    message = str(
        error or ""
    ).strip()

    if not message:
        message = (
            "Unable to complete POS checkout."
        )

    lower_message = (
        message.lower()
    )

    validation_markers = (
        "please select",
        "patient",
        "cart",
        "drug",
        "medicine",
        "stock",
        "quantity",
        "price",
        "amount paid",
        "order total",
        "not enough",
        "not found",
        "must contain",
        "must be",
        "cannot be",
    )

    if any(
        marker in lower_message
        for marker
        in validation_markers
    ):
        return HTTPException(
            status_code=400,
            detail=message,
        )

    return HTTPException(
        status_code=502,
        detail=message,
    )


# ============================================================
# GET LIVE POS PRODUCTS
#
# Source of truth:
# Google Sheets -> Apps Script -> FastAPI
#
# No local InventoryItem / Drug query is used here anymore.
# ============================================================

@router.get(
    "/products"
)
def get_pos_products(
    current_admin: User = Depends(
        get_current_admin
    ),
):
    _ = current_admin

    try:
        payload = (
            get_google_admin_pos_products()
        )

    except Exception as error:
        raise google_service_error(
            error,
            "Unable to load live POS products.",
        )

    products = (
        payload.get(
            "products",
            [],
        )
    )

    if not isinstance(
        products,
        list,
    ):
        products = []

    return {
        "products":
            products,

        "count":
            len(
                products
            ),

        "source":
            payload.get(
                "source",
                "google-sheets",
            ),

        "generated_at":
            payload.get(
                "generated_at"
            ),
    }


# ============================================================
# CHECKOUT
#
# IMPORTANT:
#
# FastAPI does NOT calculate prices.
# FastAPI does NOT decrease local stock.
# FastAPI does NOT create local POSSale records.
#
# Apps Script performs authoritative validation against:
#
# Patients
# Drugs
# Inventory
#
# and writes:
#
# Orders
# Order_Items
# Payments
# Invoices_Receipts
#
# while reducing Inventory + Drugs stock.
# ============================================================

@router.post(
    "/checkout"
)
def checkout_pos_sale(
    request: POSSaleRequest,
    current_admin: User = Depends(
        get_current_admin
    ),
):
    _ = current_admin

    google_payload = (
        build_google_checkout_payload(
            request
        )
    )

    try:
        result = (
            create_google_admin_pos_checkout(
                google_payload
            )
        )

    except HTTPException:
        raise

    except Exception as error:
        raise google_checkout_error(
            error
        )

    sale = (
        result.get(
            "sale"
        )
    )

    if not isinstance(
        sale,
        dict,
    ):
        raise HTTPException(
            status_code=502,
            detail=(
                "Google POS checkout completed "
                "without returning a valid sale record."
            ),
        )

    return {
        "message":
            result.get(
                "message",
                "POS sale completed successfully.",
            ),

        "sale":
            sale,

        "source":
            result.get(
                "source",
                "google-sheets",
            ),
    }


# ============================================================
# GET POS SALES HISTORY
#
# Uses the SAME Google Orders / Order_Items / Payments data
# used by the Admin Sales page.
#
# No local POSSale table is used anymore.
# ============================================================

@router.get(
    "/sales"
)
def get_pos_sales(
    current_admin: User = Depends(
        get_current_admin
    ),
):
    _ = current_admin

    try:
        payload = (
            get_google_admin_pos_sales()
        )

    except Exception as error:
        raise google_service_error(
            error,
            "Unable to load live POS sales.",
        )

    sales = (
        payload.get(
            "sales",
            [],
        )
    )

    if not isinstance(
        sales,
        list,
    ):
        sales = []

    return {
        "sales":
            sales,

        "count":
            len(
                sales
            ),

        "source":
            payload.get(
                "source",
                "google-sheets",
            ),

        "generated_at":
            payload.get(
                "generated_at"
            ),
    }