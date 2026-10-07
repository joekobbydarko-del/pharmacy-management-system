import gzip
import json
import os
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

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
from purchase_models import Purchase
from security import decode_access_token


router = APIRouter(
    prefix="/admin/reports",
    tags=["Admin Reports"],
)

security = HTTPBearer()


GOOGLE_APPS_SCRIPT_URL = str(
    os.getenv(
        "GOOGLE_APPS_SCRIPT_URL",
        "",
    )
).strip()


GOOGLE_APPS_SCRIPT_SYNC_KEY = str(
    os.getenv(
        "GOOGLE_APPS_SCRIPT_SYNC_KEY",
        "",
    )
).strip()


GOOGLE_SALES_TIMEOUT = 90

GOOGLE_SALES_CACHE_SECONDS = 10


_google_sales_cache = {
    "loaded_at": 0.0,
    "data": None,
}


_google_sales_lock = threading.Lock()


def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(
        get_db
    ),
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
            detail="Invalid token payload.",
        )

    user = (
        db.query(
            User
        )
        .filter(
            User.id
            ==
            numeric_user_id
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
        user.role
        or ""
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
    try:
        return float(
            value or 0
        )

    except (
        TypeError,
        ValueError,
    ):
        return 0.0


def as_int(
    value,
):
    try:
        return int(
            float(
                value or 0
            )
        )

    except (
        TypeError,
        ValueError,
    ):
        return 0


def google_sales_url():
    if not GOOGLE_APPS_SCRIPT_URL:
        raise RuntimeError(
            "GOOGLE_APPS_SCRIPT_URL is not configured."
        )

    if not GOOGLE_APPS_SCRIPT_SYNC_KEY:
        raise RuntimeError(
            "GOOGLE_APPS_SCRIPT_SYNC_KEY is not configured."
        )

    separator = (
        "&"
        if "?" in GOOGLE_APPS_SCRIPT_URL
        else "?"
    )

    query = urllib.parse.urlencode(
        {
            "action": "admin-sales",
            "key": GOOGLE_APPS_SCRIPT_SYNC_KEY,
        }
    )

    return (
        GOOGLE_APPS_SCRIPT_URL
        +
        separator
        +
        query
    )


def decode_google_response(
    response,
):
    raw = response.read()

    encoding = str(
        response.headers.get(
            "Content-Encoding",
            "",
        )
    ).lower()

    if (
        encoding == "gzip"
        and raw
    ):
        raw = gzip.decompress(
            raw
        )

    text = raw.decode(
        "utf-8",
        errors="replace",
    ).strip()

    if not text:
        raise RuntimeError(
            "Google Apps Script returned an empty response."
        )

    try:
        data = json.loads(
            text
        )

    except json.JSONDecodeError:
        preview = (
            text[:300]
            if text
            else "empty response"
        )

        raise RuntimeError(
            "Google Apps Script returned invalid JSON: "
            +
            preview
        )

    if not isinstance(
        data,
        dict,
    ):
        raise RuntimeError(
            "Google Apps Script returned an invalid sales payload."
        )

    if not data.get(
        "ok",
        False,
    ):
        raise RuntimeError(
            str(
                data.get(
                    "error"
                )
                or
                "Google sales request failed."
            )
        )

    return data


def fetch_google_admin_sales():
    url = google_sales_url()

    request = urllib.request.Request(
        url,
        method="GET",
        headers={
            "Accept": "application/json",
            "Accept-Encoding": "gzip",
            "User-Agent": "DrEvansPharmacy/1.0",
            "Cache-Control": "no-cache",
        },
    )

    try:
        with urllib.request.urlopen(
            request,
            timeout=GOOGLE_SALES_TIMEOUT,
        ) as response:
            return decode_google_response(
                response
            )

    except urllib.error.HTTPError as exc:
        try:
            body = exc.read().decode(
                "utf-8",
                errors="replace",
            )

        except Exception:
            body = ""

        preview = (
            body[:300]
            if body
            else str(exc)
        )

        raise RuntimeError(
            "Google Apps Script returned HTTP "
            +
            str(
                exc.code
            )
            +
            ": "
            +
            preview
        )

    except urllib.error.URLError as exc:
        raise RuntimeError(
            "Unable to connect to Google Apps Script: "
            +
            str(
                exc.reason
            )
        )

    except TimeoutError:
        raise RuntimeError(
            "Google Apps Script sales request timed out."
        )


def get_google_admin_sales():
    now = time.time()

    cached_data = (
        _google_sales_cache.get(
            "data"
        )
    )

    loaded_at = float(
        _google_sales_cache.get(
            "loaded_at",
            0,
        )
        or 0
    )

    if (
        cached_data is not None
        and
        now - loaded_at
        <
        GOOGLE_SALES_CACHE_SECONDS
    ):
        return cached_data

    with _google_sales_lock:
        now = time.time()

        cached_data = (
            _google_sales_cache.get(
                "data"
            )
        )

        loaded_at = float(
            _google_sales_cache.get(
                "loaded_at",
                0,
            )
            or 0
        )

        if (
            cached_data is not None
            and
            now - loaded_at
            <
            GOOGLE_SALES_CACHE_SECONDS
        ):
            return cached_data

        data = fetch_google_admin_sales()

        _google_sales_cache[
            "data"
        ] = data

        _google_sales_cache[
            "loaded_at"
        ] = time.time()

        return data


def require_google_sales_data():
    try:
        return get_google_admin_sales()

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to load live pharmacy sales from Google Sheets: "
                +
                str(exc)
            ),
        )


@router.get(
    "/overview"
)
def get_report_overview(
    current_admin: User = Depends(
        get_current_admin
    ),
):
    data = require_google_sales_data()

    overview = (
        data.get(
            "overview"
        )
        or {}
    )

    return {
        "source":
            "google-sheets",

        "total_sales":
            as_float(
                overview.get(
                    "total_sales"
                )
            ),

        "total_revenue":
            as_float(
                overview.get(
                    "total_revenue"
                )
                or
                overview.get(
                    "total_sales"
                )
            ),

        "total_cost":
            as_float(
                overview.get(
                    "total_cost"
                )
            ),

        "gross_profit":
            as_float(
                overview.get(
                    "gross_profit"
                )
                or
                overview.get(
                    "total_profit"
                )
            ),

        "total_profit":
            as_float(
                overview.get(
                    "total_profit"
                )
                or
                overview.get(
                    "gross_profit"
                )
            ),

        "total_units":
            as_int(
                overview.get(
                    "total_units"
                )
            ),

        "total_transactions":
            as_int(
                overview.get(
                    "total_transactions"
                )
            ),

        "paid_transactions":
            as_int(
                overview.get(
                    "paid_transactions"
                )
            ),

        "pending_transactions":
            as_int(
                overview.get(
                    "pending_transactions"
                )
            ),

        "completed_orders":
            as_int(
                overview.get(
                    "completed_orders"
                )
            ),

        "pending_orders":
            as_int(
                overview.get(
                    "pending_orders"
                )
            ),
    }


@router.get(
    "/sales"
)
def get_sales_report(
    current_admin: User = Depends(
        get_current_admin
    ),
):
    data = require_google_sales_data()

    sales = (
        data.get(
            "sales"
        )
        or
        data.get(
            "transactions"
        )
        or
        []
    )

    normalized_sales = []

    for sale in sales:
        if not isinstance(
            sale,
            dict,
        ):
            continue

        items = (
            sale.get(
                "items"
            )
            or
            []
        )

        normalized_items = []

        for item in items:
            if not isinstance(
                item,
                dict,
            ):
                continue

            normalized_items.append(
                {
                    "drug_id":
                        str(
                            item.get(
                                "drug_id"
                            )
                            or
                            ""
                        ),

                    "drug_name":
                        str(
                            item.get(
                                "drug_name"
                            )
                            or
                            ""
                        ),

                    "category":
                        str(
                            item.get(
                                "category"
                            )
                            or
                            ""
                        ),

                    "quantity":
                        as_int(
                            item.get(
                                "quantity"
                            )
                        ),

                    "unit_price":
                        as_float(
                            item.get(
                                "unit_price"
                            )
                        ),

                    "total_amount":
                        as_float(
                            item.get(
                                "total_amount"
                            )
                        ),

                    "cost_total":
                        as_float(
                            item.get(
                                "cost_total"
                            )
                        ),

                    "profit":
                        as_float(
                            item.get(
                                "profit"
                            )
                        ),
                }
            )

        normalized_sales.append(
            {
                "sale_number":
                    str(
                        sale.get(
                            "sale_number"
                        )
                        or
                        sale.get(
                            "order_id"
                        )
                        or
                        ""
                    ),

                "order_id":
                    str(
                        sale.get(
                            "order_id"
                        )
                        or
                        sale.get(
                            "sale_number"
                        )
                        or
                        ""
                    ),

                "patient_id":
                    str(
                        sale.get(
                            "patient_id"
                        )
                        or
                        ""
                    ),

                "customer_name":
                    str(
                        sale.get(
                            "customer_name"
                        )
                        or
                        sale.get(
                            "patient_name"
                        )
                        or
                        ""
                    ),

                "patient_name":
                    str(
                        sale.get(
                            "patient_name"
                        )
                        or
                        sale.get(
                            "customer_name"
                        )
                        or
                        ""
                    ),

                "recipient_name":
                    str(
                        sale.get(
                            "recipient_name"
                        )
                        or
                        sale.get(
                            "patient_name"
                        )
                        or
                        sale.get(
                            "customer_name"
                        )
                        or
                        ""
                    ),

                "customer_type":
                    str(
                        sale.get(
                            "customer_type"
                        )
                        or
                        ""
                    ),

                "payment_method":
                    str(
                        sale.get(
                            "payment_method"
                        )
                        or
                        ""
                    ),

                "payment_status":
                    str(
                        sale.get(
                            "payment_status"
                        )
                        or
                        ""
                    ),

                "status":
                    str(
                        sale.get(
                            "status"
                        )
                        or
                        sale.get(
                            "order_status"
                        )
                        or
                        sale.get(
                            "payment_status"
                        )
                        or
                        "Pending"
                    ),

                "order_status":
                    str(
                        sale.get(
                            "order_status"
                        )
                        or
                        ""
                    ),

                "total_amount":
                    as_float(
                        sale.get(
                            "total_amount"
                        )
                    ),

                "cost_total":
                    as_float(
                        sale.get(
                            "cost_total"
                        )
                    ),

                "profit":
                    as_float(
                        sale.get(
                            "profit"
                        )
                    ),

                "amount_paid":
                    as_float(
                        sale.get(
                            "amount_paid"
                        )
                        or
                        sale.get(
                            "received"
                        )
                    ),

                "received":
                    as_float(
                        sale.get(
                            "received"
                        )
                        or
                        sale.get(
                            "amount_paid"
                        )
                    ),

                "change_amount":
                    as_float(
                        sale.get(
                            "change_amount"
                        )
                        or
                        sale.get(
                            "change"
                        )
                    ),

                "change":
                    as_float(
                        sale.get(
                            "change"
                        )
                        or
                        sale.get(
                            "change_amount"
                        )
                    ),

                "quantity":
                    as_int(
                        sale.get(
                            "quantity"
                        )
                    ),

                "item_count":
                    as_int(
                        sale.get(
                            "item_count"
                        )
                        or
                        len(
                            normalized_items
                        )
                    ),

                "items_count":
                    as_int(
                        sale.get(
                            "items_count"
                        )
                        or
                        len(
                            normalized_items
                        )
                    ),

                "items":
                    normalized_items,

                "created_at":
                    sale.get(
                        "created_at"
                    )
                    or
                    sale.get(
                        "date"
                    ),

                "date":
                    sale.get(
                        "date"
                    )
                    or
                    sale.get(
                        "created_at"
                    ),

                "transaction_reference":
                    str(
                        sale.get(
                            "transaction_reference"
                        )
                        or
                        ""
                    ),

                "provider_reference":
                    str(
                        sale.get(
                            "provider_reference"
                        )
                        or
                        ""
                    ),

                "provider_status":
                    str(
                        sale.get(
                            "provider_status"
                        )
                        or
                        ""
                    ),

                "payment_confirmed":
                    sale.get(
                        "payment_confirmed"
                    ),

                "confirmed_by":
                    str(
                        sale.get(
                            "confirmed_by"
                        )
                        or
                        ""
                    ),

                "confirmation_date":
                    sale.get(
                        "confirmation_date"
                    ),
            }
        )

    return {
        "source":
            "google-sheets",

        "sales":
            normalized_sales,

        "transactions":
            normalized_sales,

        "count":
            len(
                normalized_sales
            ),
    }


@router.get(
    "/top-products"
)
def get_top_products_report(
    current_admin: User = Depends(
        get_current_admin
    ),
):
    data = require_google_sales_data()

    products = (
        data.get(
            "products"
        )
        or
        data.get(
            "top_products"
        )
        or
        []
    )

    normalized_products = []

    for product in products:
        if not isinstance(
            product,
            dict,
        ):
            continue

        normalized_products.append(
            {
                "drug_id":
                    str(
                        product.get(
                            "drug_id"
                        )
                        or
                        ""
                    ),

                "drug_name":
                    str(
                        product.get(
                            "drug_name"
                        )
                        or
                        "Medicine"
                    ),

                "category":
                    str(
                        product.get(
                            "category"
                        )
                        or
                        ""
                    ),

                "units_sold":
                    as_int(
                        product.get(
                            "units_sold"
                        )
                        or
                        product.get(
                            "quantity_sold"
                        )
                    ),

                "quantity":
                    as_int(
                        product.get(
                            "units_sold"
                        )
                        or
                        product.get(
                            "quantity_sold"
                        )
                    ),

                "revenue":
                    as_float(
                        product.get(
                            "revenue"
                        )
                        or
                        product.get(
                            "sales"
                        )
                    ),

                "total":
                    as_float(
                        product.get(
                            "revenue"
                        )
                        or
                        product.get(
                            "sales"
                        )
                    ),

                "cost":
                    as_float(
                        product.get(
                            "cost"
                        )
                    ),

                "profit":
                    as_float(
                        product.get(
                            "profit"
                        )
                    ),

                "order_count":
                    as_int(
                        product.get(
                            "order_count"
                        )
                    ),
            }
        )

    return {
        "source":
            "google-sheets",

        "products":
            normalized_products,

        "top_products":
            normalized_products,

        "count":
            len(
                normalized_products
            ),
    }


@router.get(
    "/purchases"
)
def get_purchases_report(
    db: Session = Depends(
        get_db
    ),
    current_admin: User = Depends(
        get_current_admin
    ),
):
    purchases = (
        db.query(
            Purchase
        )
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


@router.get(
    "/inventory"
)
def get_inventory_report(
    db: Session = Depends(
        get_db
    ),
    current_admin: User = Depends(
        get_current_admin
    ),
):
    items = (
        db.query(
            InventoryItem
        )
        .order_by(
            InventoryItem.drug_name.asc()
        )
        .all()
    )

    report = []

    for item in items:
        if (
            item.stock_quantity
            <=
            0
        ):
            status = (
                "Out of Stock"
            )

        elif (
            item.stock_quantity
            <=
            item.reorder_level
        ):
            status = (
                "Low Stock"
            )

        else:
            status = (
                "Healthy"
            )

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