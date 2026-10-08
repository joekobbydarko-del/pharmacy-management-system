import threading
import time

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

from inventory_sync import (
    get_google_action_data,
    get_google_admin_dashboard_data,
)

from models import User
from security import decode_access_token


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/admin/reports",
    tags=["Admin Reports"],
)


security = HTTPBearer()


# =========================================================
# SHARED GOOGLE CACHE
# =========================================================

REPORT_CACHE_TTL_SECONDS = 15


_REPORT_CACHE = {
    "sales": {
        "loaded_at": 0.0,
        "data": None,
    },

    "purchases": {
        "loaded_at": 0.0,
        "data": None,
    },

    "dashboard": {
        "loaded_at": 0.0,
        "data": None,
    },
}


_REPORT_LOCKS = {
    "sales": threading.Lock(),
    "purchases": threading.Lock(),
    "dashboard": threading.Lock(),
}


# =========================================================
# DATABASE
# =========================================================

def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# =========================================================
# ADMIN AUTH
# =========================================================

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
        user.role or ""
    ).strip().lower()

    if role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Administrator access required.",
        )

    return user


# =========================================================
# BASIC HELPERS
# =========================================================

def clean_text(
    value,
):
    if value is None:
        return ""

    return str(
        value
    ).strip()


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


def first_value(
    source,
    *keys,
    default=None,
):
    if not isinstance(
        source,
        dict,
    ):
        return default

    for key in keys:
        value = source.get(
            key
        )

        if value is None:
            continue

        if isinstance(
            value,
            str,
        ):
            if value.strip():
                return value

            continue

        return value

    return default


def normalize_status(
    value,
):
    text = clean_text(
        value
    )

    return (
        text
        if text
        else "Pending"
    )


# =========================================================
# CACHE HELPERS
# =========================================================

def cache_is_fresh(
    cache_name,
):
    cache = _REPORT_CACHE[
        cache_name
    ]

    data = cache.get(
        "data"
    )

    if data is None:
        return False

    loaded_at = float(
        cache.get(
            "loaded_at",
            0.0,
        )
        or 0.0
    )

    age = (
        time.monotonic()
        -
        loaded_at
    )

    return (
        age
        <
        REPORT_CACHE_TTL_SECONDS
    )


def get_cached_data(
    cache_name,
):
    if not cache_is_fresh(
        cache_name
    ):
        return None

    return _REPORT_CACHE[
        cache_name
    ].get(
        "data"
    )


def set_cached_data(
    cache_name,
    data,
):
    _REPORT_CACHE[
        cache_name
    ] = {
        "loaded_at":
            time.monotonic(),

        "data":
            data,
    }

    return data


# =========================================================
# GOOGLE LOADERS
# FETCH ONCE, REUSE ACROSS REPORT ENDPOINTS
# =========================================================

def load_google_sales_data():
    cached = get_cached_data(
        "sales"
    )

    if cached is not None:
        return cached

    lock = _REPORT_LOCKS[
        "sales"
    ]

    with lock:
        cached = get_cached_data(
            "sales"
        )

        if cached is not None:
            return cached

        data = get_google_action_data(
            "admin-sales",
            "Google admin sales",
        )

        if not isinstance(
            data,
            dict,
        ):
            raise RuntimeError(
                "Google sales response was invalid."
            )

        return set_cached_data(
            "sales",
            data,
        )


def load_google_purchases_data():
    cached = get_cached_data(
        "purchases"
    )

    if cached is not None:
        return cached

    lock = _REPORT_LOCKS[
        "purchases"
    ]

    with lock:
        cached = get_cached_data(
            "purchases"
        )

        if cached is not None:
            return cached

        data = get_google_action_data(
            "admin-purchases",
            "Google admin purchases",
        )

        if not isinstance(
            data,
            dict,
        ):
            raise RuntimeError(
                "Google purchases response was invalid."
            )

        return set_cached_data(
            "purchases",
            data,
        )


def load_google_dashboard_data():
    cached = get_cached_data(
        "dashboard"
    )

    if cached is not None:
        return cached

    lock = _REPORT_LOCKS[
        "dashboard"
    ]

    with lock:
        cached = get_cached_data(
            "dashboard"
        )

        if cached is not None:
            return cached

        data = (
            get_google_admin_dashboard_data()
        )

        if not isinstance(
            data,
            dict,
        ):
            raise RuntimeError(
                "Google dashboard response was invalid."
            )

        return set_cached_data(
            "dashboard",
            data,
        )


# =========================================================
# REQUIRED GOOGLE DATA
# =========================================================

def require_google_sales_data():
    try:
        return load_google_sales_data()

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to load live pharmacy sales "
                "from Google Sheets: "
                +
                str(exc)
            ),
        )


def require_google_purchases_data():
    try:
        return load_google_purchases_data()

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to load live pharmacy purchases "
                "from Google Sheets: "
                +
                str(exc)
            ),
        )


def require_google_dashboard_data():
    try:
        return load_google_dashboard_data()

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to load live pharmacy inventory "
                "from Google Sheets: "
                +
                str(exc)
            ),
        )


# =========================================================
# SALE ITEM NORMALIZATION
# =========================================================

def normalize_sale_item(
    item,
):
    if not isinstance(
        item,
        dict,
    ):
        return None

    quantity = as_int(
        first_value(
            item,
            "quantity",
            "Quantity",
            "qty",
            default=0,
        )
    )

    unit_price = as_float(
        first_value(
            item,
            "unit_price",
            "Unit_Price",
            "price",
            default=0,
        )
    )

    total_amount = as_float(
        first_value(
            item,
            "total_amount",
            "Line_Total",
            "line_total",
            "amount",
            default=0,
        )
    )

    if (
        total_amount <= 0
        and
        quantity > 0
        and
        unit_price > 0
    ):
        total_amount = (
            quantity
            *
            unit_price
        )

    return {
        "drug_id":
            clean_text(
                first_value(
                    item,
                    "drug_id",
                    "Drug_ID",
                    default="",
                )
            ),

        "drug_name":
            clean_text(
                first_value(
                    item,
                    "drug_name",
                    "Drug_Name",
                    "name",
                    default="",
                )
            ),

        "category":
            clean_text(
                first_value(
                    item,
                    "category",
                    "Category",
                    default="",
                )
            ),

        "quantity":
            quantity,

        "unit_price":
            unit_price,

        "total_amount":
            total_amount,

        "cost_total":
            as_float(
                first_value(
                    item,
                    "cost_total",
                    "Cost_Total",
                    default=0,
                )
            ),

        "profit":
            as_float(
                first_value(
                    item,
                    "profit",
                    "Profit",
                    default=0,
                )
            ),
    }


# =========================================================
# SALE NORMALIZATION
# =========================================================

def normalize_sale(
    sale,
):
    if not isinstance(
        sale,
        dict,
    ):
        return None

    raw_items = (
        first_value(
            sale,
            "items",
            "order_items",
            default=[],
        )
        or []
    )

    items = []

    if isinstance(
        raw_items,
        list,
    ):
        for raw_item in raw_items:
            normalized_item = (
                normalize_sale_item(
                    raw_item
                )
            )

            if normalized_item:
                items.append(
                    normalized_item
                )

    sale_number = clean_text(
        first_value(
            sale,
            "sale_number",
            "order_id",
            "Order_ID",
            default="",
        )
    )

    order_id = clean_text(
        first_value(
            sale,
            "order_id",
            "Order_ID",
            "sale_number",
            default=sale_number,
        )
    )

    patient_name = clean_text(
        first_value(
            sale,
            "patient_name",
            "customer_name",
            "recipient_name",
            "Full_Name",
            default="",
        )
    )

    total_amount = as_float(
        first_value(
            sale,
            "total_amount",
            "order_total",
            "Order_Total",
            "total",
            default=0,
        )
    )

    if (
        total_amount <= 0
        and
        items
    ):
        total_amount = sum(
            as_float(
                item.get(
                    "total_amount"
                )
            )
            for item in items
        )

    quantity = as_int(
        first_value(
            sale,
            "quantity",
            "total_quantity",
            default=0,
        )
    )

    if (
        quantity <= 0
        and
        items
    ):
        quantity = sum(
            as_int(
                item.get(
                    "quantity"
                )
            )
            for item in items
        )

    item_count = as_int(
        first_value(
            sale,
            "item_count",
            "items_count",
            default=0,
        )
    )

    if (
        item_count <= 0
        and
        items
    ):
        item_count = len(
            items
        )

    amount_paid = as_float(
        first_value(
            sale,
            "amount_paid",
            "received",
            "Amount_Paid",
            default=0,
        )
    )

    change_amount = as_float(
        first_value(
            sale,
            "change_amount",
            "change",
            default=0,
        )
    )

    return {
        "sale_number":
            sale_number,

        "order_id":
            order_id,

        "patient_id":
            clean_text(
                first_value(
                    sale,
                    "patient_id",
                    "Patient_ID",
                    default="",
                )
            ),

        "customer_name":
            patient_name,

        "patient_name":
            patient_name,

        "recipient_name":
            patient_name,

        "customer_type":
            clean_text(
                first_value(
                    sale,
                    "customer_type",
                    "Customer_Type",
                    default="",
                )
            ),

        "payment_method":
            clean_text(
                first_value(
                    sale,
                    "payment_method",
                    "Payment_Method",
                    default="",
                )
            ),

        "payment_status":
            clean_text(
                first_value(
                    sale,
                    "payment_status",
                    "Payment_Status",
                    default="",
                )
            ),

        "status":
            normalize_status(
                first_value(
                    sale,
                    "status",
                    "order_status",
                    "Order_Status",
                    "payment_status",
                    default="Pending",
                )
            ),

        "order_status":
            clean_text(
                first_value(
                    sale,
                    "order_status",
                    "Order_Status",
                    default="",
                )
            ),

        "total_amount":
            total_amount,

        "cost_total":
            as_float(
                first_value(
                    sale,
                    "cost_total",
                    "total_cost",
                    default=0,
                )
            ),

        "profit":
            as_float(
                first_value(
                    sale,
                    "profit",
                    "gross_profit",
                    default=0,
                )
            ),

        "amount_paid":
            amount_paid,

        "received":
            amount_paid,

        "change_amount":
            change_amount,

        "change":
            change_amount,

        "quantity":
            quantity,

        "item_count":
            item_count,

        "items_count":
            item_count,

        "items":
            items,

        "created_at":
            first_value(
                sale,
                "created_at",
                "date",
                "order_date",
                "Order_Date",
                default=None,
            ),

        "date":
            first_value(
                sale,
                "date",
                "created_at",
                "order_date",
                "Order_Date",
                default=None,
            ),

        "transaction_reference":
            clean_text(
                first_value(
                    sale,
                    "transaction_reference",
                    "Transaction_Reference",
                    default="",
                )
            ),

        "provider_reference":
            clean_text(
                first_value(
                    sale,
                    "provider_reference",
                    "Provider_Reference",
                    default="",
                )
            ),
    }


def extract_google_sales(
    payload,
):
    if not isinstance(
        payload,
        dict,
    ):
        return []

    raw_sales = (
        payload.get(
            "sales"
        )
        or
        payload.get(
            "transactions"
        )
        or
        payload.get(
            "orders"
        )
        or
        []
    )

    if not isinstance(
        raw_sales,
        list,
    ):
        return []

    sales = []

    for raw_sale in raw_sales:
        normalized = normalize_sale(
            raw_sale
        )

        if normalized:
            sales.append(
                normalized
            )

    return sales


# =========================================================
# TOP PRODUCTS
# =========================================================

def normalize_top_product(
    product,
):
    if not isinstance(
        product,
        dict,
    ):
        return None

    units_sold = as_int(
        first_value(
            product,
            "units_sold",
            "quantity_sold",
            "quantity",
            default=0,
        )
    )

    revenue = as_float(
        first_value(
            product,
            "revenue",
            "sales",
            "total",
            default=0,
        )
    )

    return {
        "drug_id":
            clean_text(
                first_value(
                    product,
                    "drug_id",
                    "Drug_ID",
                    default="",
                )
            ),

        "drug_name":
            clean_text(
                first_value(
                    product,
                    "drug_name",
                    "Drug_Name",
                    "name",
                    default="Medicine",
                )
            )
            or
            "Medicine",

        "category":
            clean_text(
                first_value(
                    product,
                    "category",
                    "Category",
                    default="",
                )
            ),

        "units_sold":
            units_sold,

        "quantity":
            units_sold,

        "revenue":
            revenue,

        "total":
            revenue,

        "cost":
            as_float(
                first_value(
                    product,
                    "cost",
                    "cost_total",
                    default=0,
                )
            ),

        "profit":
            as_float(
                first_value(
                    product,
                    "profit",
                    default=0,
                )
            ),

        "order_count":
            as_int(
                first_value(
                    product,
                    "order_count",
                    default=0,
                )
            ),
    }


def extract_google_top_products(
    payload,
):
    if not isinstance(
        payload,
        dict,
    ):
        return []

    raw_products = (
        payload.get(
            "products"
        )
        or
        payload.get(
            "top_products"
        )
        or
        []
    )

    if not isinstance(
        raw_products,
        list,
    ):
        return []

    products = []

    for raw_product in raw_products:
        normalized = (
            normalize_top_product(
                raw_product
            )
        )

        if normalized:
            products.append(
                normalized
            )

    products.sort(
        key=lambda product: (
            as_float(
                product.get(
                    "revenue"
                )
            ),
            as_int(
                product.get(
                    "units_sold"
                )
            ),
        ),
        reverse=True,
    )

    return products


# =========================================================
# PURCHASE NORMALIZATION
# =========================================================

def normalize_purchase(
    purchase,
):
    if not isinstance(
        purchase,
        dict,
    ):
        return None

    purchase_number = clean_text(
        first_value(
            purchase,
            "purchase_number",
            "purchase_id",
            "Purchase_ID",
            default="",
        )
    )

    supplier_name = clean_text(
        first_value(
            purchase,
            "supplier_name",
            "Supplier_Name",
            "supplier",
            default="",
        )
    )

    total_amount = as_float(
        first_value(
            purchase,
            "total_amount",
            "Total_Amount",
            "purchase_total",
            "total",
            default=0,
        )
    )

    return {
        "purchase_number":
            purchase_number,

        "purchase_id":
            purchase_number,

        "supplier_id":
            clean_text(
                first_value(
                    purchase,
                    "supplier_id",
                    "Supplier_ID",
                    default="",
                )
            ),

        "supplier_name":
            supplier_name,

        "reference_number":
            clean_text(
                first_value(
                    purchase,
                    "reference_number",
                    "Reference_Number",
                    "supplier_reference",
                    default="",
                )
            ),

        "payment_status":
            normalize_status(
                first_value(
                    purchase,
                    "payment_status",
                    "Payment_Status",
                    default="Pending",
                )
            ),

        "status":
            normalize_status(
                first_value(
                    purchase,
                    "status",
                    "purchase_status",
                    "Purchase_Status",
                    default="Pending",
                )
            ),

        "total_amount":
            total_amount,

        "created_at":
            first_value(
                purchase,
                "created_at",
                "purchase_date",
                "Purchase_Date",
                "date",
                default=None,
            ),

        "date":
            first_value(
                purchase,
                "date",
                "purchase_date",
                "Purchase_Date",
                "created_at",
                default=None,
            ),
    }


def extract_google_purchases(
    payload,
):
    if not isinstance(
        payload,
        dict,
    ):
        return []

    raw_purchases = (
        payload.get(
            "purchases"
        )
        or
        payload.get(
            "records"
        )
        or
        payload.get(
            "transactions"
        )
        or
        []
    )

    if not isinstance(
        raw_purchases,
        list,
    ):
        return []

    purchases = []

    for raw_purchase in raw_purchases:
        normalized = normalize_purchase(
            raw_purchase
        )

        if normalized:
            purchases.append(
                normalized
            )

    return purchases


# =========================================================
# INVENTORY
# =========================================================

def calculate_inventory_status(
    stock_quantity,
    reorder_level,
    explicit_status="",
):
    status = clean_text(
        explicit_status
    ).lower()

    if status in {
        "out of stock",
        "out_of_stock",
        "out",
    }:
        return "Out of Stock"

    if status in {
        "low stock",
        "low_stock",
        "low",
    }:
        return "Low Stock"

    if status in {
        "healthy",
        "in stock",
        "in_stock",
        "available",
    }:
        return "Healthy"

    if stock_quantity <= 0:
        return "Out of Stock"

    if stock_quantity <= reorder_level:
        return "Low Stock"

    return "Healthy"


def normalize_inventory_item(
    item,
):
    if not isinstance(
        item,
        dict,
    ):
        return None

    stock_quantity = as_int(
        first_value(
            item,
            "stock_quantity",
            "Stock_Quantity",
            "quantity",
            default=0,
        )
    )

    reorder_level = as_int(
        first_value(
            item,
            "reorder_level",
            "Reorder_Level",
            default=0,
        )
    )

    status = calculate_inventory_status(
        stock_quantity,
        reorder_level,
        first_value(
            item,
            "status",
            "stock_status",
            "Stock_Status",
            default="",
        ),
    )

    return {
        "inventory_id":
            clean_text(
                first_value(
                    item,
                    "inventory_id",
                    "Inventory_ID",
                    default="",
                )
            ),

        "drug_id":
            clean_text(
                first_value(
                    item,
                    "drug_id",
                    "Drug_ID",
                    default="",
                )
            ),

        "drug_name":
            clean_text(
                first_value(
                    item,
                    "drug_name",
                    "Drug_Name",
                    "name",
                    default="Medicine",
                )
            )
            or
            "Medicine",

        "category":
            clean_text(
                first_value(
                    item,
                    "category",
                    "Category",
                    default="",
                )
            ),

        "stock_quantity":
            stock_quantity,

        "reorder_level":
            reorder_level,

        "status":
            status,

        "stock_status":
            status,

        "cost_price":
            as_float(
                first_value(
                    item,
                    "cost_price",
                    "Cost_Price",
                    default=0,
                )
            ),

        "monthly_price":
            as_float(
                first_value(
                    item,
                    "monthly_price",
                    "Monthly_Price",
                    default=0,
                )
            ),

        "one_time_price":
            as_float(
                first_value(
                    item,
                    "one_time_price",
                    "One_Time_Price",
                    "price",
                    default=0,
                )
            ),

        "last_updated":
            first_value(
                item,
                "last_updated",
                "Last_Updated",
                default=None,
            ),
    }


def extract_dashboard_inventory(
    dashboard,
):
    if not isinstance(
        dashboard,
        dict,
    ):
        return []

    inventory_rows = (
        dashboard.get(
            "inventory"
        )
        or
        dashboard.get(
            "Inventory"
        )
        or
        []
    )

    drug_rows = (
        dashboard.get(
            "drugs"
        )
        or
        dashboard.get(
            "Drugs"
        )
        or
        []
    )

    if not isinstance(
        inventory_rows,
        list,
    ):
        inventory_rows = []

    if not isinstance(
        drug_rows,
        list,
    ):
        drug_rows = []

    drugs_by_id = {}

    for drug in drug_rows:
        if not isinstance(
            drug,
            dict,
        ):
            continue

        drug_id = clean_text(
            first_value(
                drug,
                "drug_id",
                "Drug_ID",
                default="",
            )
        )

        if drug_id:
            drugs_by_id[
                drug_id
            ] = drug

    inventory = []

    for row in inventory_rows:
        if not isinstance(
            row,
            dict,
        ):
            continue

        drug_id = clean_text(
            first_value(
                row,
                "drug_id",
                "Drug_ID",
                default="",
            )
        )

        merged = {}

        if drug_id in drugs_by_id:
            merged.update(
                drugs_by_id[
                    drug_id
                ]
            )

        merged.update(
            row
        )

        normalized = (
            normalize_inventory_item(
                merged
            )
        )

        if normalized:
            inventory.append(
                normalized
            )

    if not inventory:
        for drug in drug_rows:
            normalized = (
                normalize_inventory_item(
                    drug
                )
            )

            if normalized:
                inventory.append(
                    normalized
                )

    inventory.sort(
        key=lambda item:
            clean_text(
                item.get(
                    "drug_name"
                )
            ).lower()
    )

    return inventory


# =========================================================
# OVERVIEW
# =========================================================

@router.get(
    "/overview"
)
def get_reports_overview(
    current_admin: User = Depends(
        get_current_admin
    ),
):
    sales_payload = (
        require_google_sales_data()
    )

    purchases_payload = (
        require_google_purchases_data()
    )

    dashboard_payload = (
        require_google_dashboard_data()
    )

    sales = extract_google_sales(
        sales_payload
    )

    purchases = (
        extract_google_purchases(
            purchases_payload
        )
    )

    inventory = (
        extract_dashboard_inventory(
            dashboard_payload
        )
    )

    overview = (
        sales_payload.get(
            "overview"
        )
        or {}
    )

    calculated_sales = sum(
        as_float(
            item.get(
                "total_amount"
            )
        )
        for item in sales
    )

    total_sales = as_float(
        first_value(
            overview,
            "total_sales",
            "total_revenue",
            default=calculated_sales,
        )
    )

    if (
        total_sales <= 0
        and
        calculated_sales > 0
    ):
        total_sales = (
            calculated_sales
        )

    total_cost = as_float(
        first_value(
            overview,
            "total_cost",
            default=sum(
                as_float(
                    item.get(
                        "cost_total"
                    )
                )
                for item in sales
            ),
        )
    )

    total_profit = as_float(
        first_value(
            overview,
            "total_profit",
            "gross_profit",
            default=sum(
                as_float(
                    item.get(
                        "profit"
                    )
                )
                for item in sales
            ),
        )
    )

    total_units = as_int(
        first_value(
            overview,
            "total_units",
            default=sum(
                as_int(
                    item.get(
                        "quantity"
                    )
                )
                for item in sales
            ),
        )
    )

    total_transactions = as_int(
        first_value(
            overview,
            "total_transactions",
            default=len(
                sales
            ),
        )
    )

    paid_transactions = as_int(
        first_value(
            overview,
            "paid_transactions",
            default=sum(
                1
                for item in sales
                if clean_text(
                    item.get(
                        "payment_status"
                    )
                ).lower()
                ==
                "paid"
            ),
        )
    )

    pending_transactions = as_int(
        first_value(
            overview,
            "pending_transactions",
            default=sum(
                1
                for item in sales
                if clean_text(
                    item.get(
                        "payment_status"
                    )
                ).lower()
                !=
                "paid"
            ),
        )
    )

    completed_orders = as_int(
        first_value(
            overview,
            "completed_orders",
            default=sum(
                1
                for item in sales
                if clean_text(
                    item.get(
                        "order_status"
                    )
                ).lower()
                ==
                "completed"
            ),
        )
    )

    pending_orders = as_int(
        first_value(
            overview,
            "pending_orders",
            default=sum(
                1
                for item in sales
                if clean_text(
                    item.get(
                        "order_status"
                    )
                ).lower()
                ==
                "pending"
            ),
        )
    )

    total_purchases = sum(
        as_float(
            item.get(
                "total_amount"
            )
        )
        for item in purchases
    )

    inventory_units = sum(
        as_int(
            item.get(
                "stock_quantity"
            )
        )
        for item in inventory
    )

    low_stock_items = sum(
        1
        for item in inventory
        if clean_text(
            item.get(
                "status"
            )
        ).lower()
        in {
            "low stock",
            "out of stock",
        }
    )

    out_of_stock_items = sum(
        1
        for item in inventory
        if clean_text(
            item.get(
                "status"
            )
        ).lower()
        ==
        "out of stock"
    )

    healthy_inventory_items = sum(
        1
        for item in inventory
        if clean_text(
            item.get(
                "status"
            )
        ).lower()
        ==
        "healthy"
    )

    return {
        "source":
            "google-sheets",

        "cache_seconds":
            REPORT_CACHE_TTL_SECONDS,

        "total_sales":
            total_sales,

        "total_revenue":
            total_sales,

        "total_cost":
            total_cost,

        "gross_profit":
            total_profit,

        "total_profit":
            total_profit,

        "total_units":
            total_units,

        "total_transactions":
            total_transactions,

        "paid_transactions":
            paid_transactions,

        "pending_transactions":
            pending_transactions,

        "completed_orders":
            completed_orders,

        "pending_orders":
            pending_orders,

        "total_purchases":
            total_purchases,

        "total_purchase_amount":
            total_purchases,

        "total_purchase_records":
            len(
                purchases
            ),

        "purchase_records":
            len(
                purchases
            ),

        "inventory_units":
            inventory_units,

        "total_inventory_units":
            inventory_units,

        "inventory_items":
            len(
                inventory
            ),

        "low_stock_items":
            low_stock_items,

        "out_of_stock_items":
            out_of_stock_items,

        "healthy_inventory_items":
            healthy_inventory_items,
    }


# =========================================================
# SALES
# =========================================================

@router.get(
    "/sales"
)
def get_reports_sales(
    current_admin: User = Depends(
        get_current_admin
    ),
):
    payload = (
        require_google_sales_data()
    )

    sales = extract_google_sales(
        payload
    )

    return {
        "source":
            "google-sheets",

        "sales":
            sales,

        "transactions":
            sales,

        "count":
            len(
                sales
            ),
    }


# =========================================================
# TOP PRODUCTS
# =========================================================

@router.get(
    "/top-products"
)
def get_reports_top_products(
    current_admin: User = Depends(
        get_current_admin
    ),
):
    payload = (
        require_google_sales_data()
    )

    products = (
        extract_google_top_products(
            payload
        )
    )

    return {
        "source":
            "google-sheets",

        "products":
            products,

        "top_products":
            products,

        "count":
            len(
                products
            ),
    }


# =========================================================
# PURCHASES
# =========================================================

@router.get(
    "/purchases"
)
def get_reports_purchases(
    current_admin: User = Depends(
        get_current_admin
    ),
):
    payload = (
        require_google_purchases_data()
    )

    purchases = (
        extract_google_purchases(
            payload
        )
    )

    total_amount = sum(
        as_float(
            item.get(
                "total_amount"
            )
        )
        for item in purchases
    )

    completed_count = sum(
        1
        for item in purchases
        if clean_text(
            item.get(
                "status"
            )
        ).lower()
        in {
            "completed",
            "received",
        }
    )

    pending_count = (
        len(
            purchases
        )
        -
        completed_count
    )

    return {
        "source":
            "google-sheets",

        "purchases":
            purchases,

        "records":
            purchases,

        "count":
            len(
                purchases
            ),

        "total_amount":
            total_amount,

        "total_purchases":
            total_amount,

        "completed_count":
            completed_count,

        "pending_count":
            pending_count,
    }


# =========================================================
# INVENTORY
# =========================================================

@router.get(
    "/inventory"
)
def get_reports_inventory(
    current_admin: User = Depends(
        get_current_admin
    ),
):
    dashboard = (
        require_google_dashboard_data()
    )

    inventory = (
        extract_dashboard_inventory(
            dashboard
        )
    )

    total_units = sum(
        as_int(
            item.get(
                "stock_quantity"
            )
        )
        for item in inventory
    )

    healthy_count = sum(
        1
        for item in inventory
        if clean_text(
            item.get(
                "status"
            )
        ).lower()
        ==
        "healthy"
    )

    low_stock_count = sum(
        1
        for item in inventory
        if clean_text(
            item.get(
                "status"
            )
        ).lower()
        ==
        "low stock"
    )

    out_of_stock_count = sum(
        1
        for item in inventory
        if clean_text(
            item.get(
                "status"
            )
        ).lower()
        ==
        "out of stock"
    )

    return {
        "source":
            "google-sheets",

        "inventory":
            inventory,

        "items":
            inventory,

        "count":
            len(
                inventory
            ),

        "total_units":
            total_units,

        "inventory_units":
            total_units,

        "healthy_count":
            healthy_count,

        "low_stock_count":
            low_stock_count,

        "low_stock_items":
            (
                low_stock_count
                +
                out_of_stock_count
            ),

        "out_of_stock_count":
            out_of_stock_count,
    }