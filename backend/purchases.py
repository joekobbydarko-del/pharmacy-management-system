import json
import os

import requests

from dotenv import load_dotenv

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
from models import User
from security import decode_access_token


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()


GOOGLE_APPS_SCRIPT_URL = (
    os.getenv(
        "GOOGLE_APPS_SCRIPT_URL",
        "",
    )
    .strip()
)


GOOGLE_APPS_SCRIPT_SYNC_KEY = (
    os.getenv(
        "GOOGLE_APPS_SCRIPT_SYNC_KEY",
        "",
    )
    .strip()
)


GOOGLE_REQUEST_TIMEOUT = 90


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/admin/purchases",
    tags=["Admin Purchases"],
)


# ============================================================
# SECURITY
# ============================================================

security = HTTPBearer()


# ============================================================
# DATABASE
# ONLY USED FOR ADMIN AUTHENTICATION
# ============================================================

def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ============================================================
# CURRENT ADMIN
# ============================================================

def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(
        get_db
    ),
):
    token = credentials.credentials

    try:
        payload = decode_access_token(
            token
        )

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token.",
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
            == numeric_user_id
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


# ============================================================
# REQUEST MODELS
# ============================================================

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
    # IMPORTANT:
    # Supplier must already exist in Suppliers.
    # Purchases never create suppliers.
    supplier_id: str

    reference_number: str | None = None

    payment_status: str = "pending"

    items: list[
        PurchaseItemRequest
    ]


# ============================================================
# GOOGLE CONFIG VALIDATION
# ============================================================

def validate_google_config():
    if not GOOGLE_APPS_SCRIPT_URL:
        raise RuntimeError(
            "GOOGLE_APPS_SCRIPT_URL is not configured."
        )

    if not GOOGLE_APPS_SCRIPT_SYNC_KEY:
        raise RuntimeError(
            "GOOGLE_APPS_SCRIPT_SYNC_KEY is not configured."
        )


# ============================================================
# NORMALIZATION HELPERS
# ============================================================

def clean_text(
    value,
):
    return str(
        value or ""
    ).strip()


def safe_float(
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


def safe_int(
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


def safe_bool(
    value,
):
    if isinstance(
        value,
        bool,
    ):
        return value

    return (
        str(
            value or ""
        )
        .strip()
        .lower()
        in {
            "true",
            "1",
            "yes",
            "active",
        }
    )


# ============================================================
# GOOGLE JSON RESPONSE
# ============================================================

def parse_google_response(
    response: requests.Response,
    action: str,
):
    response_text = (
        response.text
        or ""
    ).strip()

    if not response.ok:
        preview = (
            response_text[:300]
            if response_text
            else "No response body."
        )

        raise RuntimeError(
            (
                "Google Apps Script request failed "
                f"for {action}. "
                f"HTTP {response.status_code}. "
                f"Response started with: {preview}"
            )
        )

    if not response_text:
        raise RuntimeError(
            (
                "Google Apps Script returned an empty "
                f"response for {action}."
            )
        )

    try:
        payload = response.json()

    except (
        ValueError,
        json.JSONDecodeError,
    ):
        raise RuntimeError(
            (
                "Google Apps Script returned invalid JSON "
                f"for {action}. "
                f"Response started with: "
                f"{response_text[:300]}"
            )
        )

    if not isinstance(
        payload,
        dict,
    ):
        raise RuntimeError(
            (
                "Google Apps Script returned an invalid "
                f"payload for {action}."
            )
        )

    if payload.get(
        "ok"
    ) is False:
        raise RuntimeError(
            str(
                payload.get(
                    "error"
                )
                or
                (
                    "Google Apps Script rejected "
                    f"the {action} request."
                )
            )
        )

    return payload


# ============================================================
# GOOGLE GET
# ============================================================

def google_get(
    action: str,
):
    validate_google_config()

    params = {
        "action":
            action,

        "key":
            GOOGLE_APPS_SCRIPT_SYNC_KEY,
    }

    last_error = None

    for attempt in range(
        1,
        4,
    ):
        try:
            response = requests.get(
                GOOGLE_APPS_SCRIPT_URL,
                params=params,
                timeout=GOOGLE_REQUEST_TIMEOUT,
                allow_redirects=True,
            )

            return parse_google_response(
                response,
                action,
            )

        except requests.RequestException as error:
            last_error = error

            if attempt >= 3:
                break

        except RuntimeError:
            raise

    raise RuntimeError(
        (
            "Unable to reach Google Apps Script "
            f"for {action}: {last_error}"
        )
    )


# ============================================================
# GOOGLE POST
#
# Apps Script may successfully execute a POST and then return
# a redirect that requests/Google handles badly.
#
# We DO NOT blindly retry POST requests because that could
# record the same purchase twice and increase inventory twice.
# ============================================================

def google_post_raw(
    action: str,
    payload: dict,
):
    validate_google_config()

    params = {
        "action":
            action,

        "key":
            GOOGLE_APPS_SCRIPT_SYNC_KEY,
    }

    session = requests.Session()

    try:
        response = session.post(
            GOOGLE_APPS_SCRIPT_URL,
            params=params,
            json=payload,
            timeout=GOOGLE_REQUEST_TIMEOUT,
            allow_redirects=False,
        )

    except requests.RequestException as error:
        raise RuntimeError(
            (
                "Unable to reach Google Apps Script "
                f"for {action}: {error}"
            )
        )

    # --------------------------------------------------------
    # Direct JSON response
    # --------------------------------------------------------

    if response.status_code == 200:
        return parse_google_response(
            response,
            action,
        )

    # --------------------------------------------------------
    # Google Apps Script redirect
    # --------------------------------------------------------

    if response.status_code in {
        301,
        302,
        303,
        307,
        308,
    }:
        location = clean_text(
            response.headers.get(
                "Location"
            )
        )

        if location:
            try:
                redirected = session.get(
                    location,
                    timeout=GOOGLE_REQUEST_TIMEOUT,
                    allow_redirects=True,
                )

                if redirected.ok:
                    response_text = (
                        redirected.text
                        or ""
                    ).strip()

                    if response_text:
                        try:
                            data = redirected.json()

                            if isinstance(
                                data,
                                dict,
                            ):
                                if data.get(
                                    "ok"
                                ) is False:
                                    raise RuntimeError(
                                        str(
                                            data.get(
                                                "error"
                                            )
                                            or
                                            (
                                                "Google Apps Script "
                                                "rejected the request."
                                            )
                                        )
                                    )

                                return data

                        except (
                            ValueError,
                            json.JSONDecodeError,
                        ):
                            pass

            except requests.RequestException:
                pass

        # POST may already have successfully executed.
        return {
            "ok":
                True,

            "_post_response_unreadable":
                True,
        }

    # --------------------------------------------------------
    # We have previously seen Apps Script return HTTP 404
    # after the script already changed the Sheet.
    # Verification after POST decides whether it succeeded.
    # --------------------------------------------------------

    if response.status_code == 404:
        return {
            "ok":
                True,

            "_post_response_unreadable":
                True,

            "_post_status":
                404,
        }

    preview = (
        response.text[:300]
        if response.text
        else "No response body."
    )

    raise RuntimeError(
        (
            "Google Apps Script POST failed "
            f"for {action}. "
            f"HTTP {response.status_code}. "
            f"Response started with: {preview}"
        )
    )


# ============================================================
# LOAD LIVE PURCHASE DATA
# ============================================================

def get_google_purchase_data():
    return google_get(
        "admin-purchases"
    )


# ============================================================
# NORMALIZE DRUG
# ============================================================

def normalize_drug(
    item,
):
    return {
        "drug_id":
            clean_text(
                item.get(
                    "drug_id"
                )
            ),

        "drug_name":
            clean_text(
                item.get(
                    "drug_name"
                )
            ),

        "category":
            clean_text(
                item.get(
                    "category"
                )
            ),

        "cost_price":
            safe_float(
                item.get(
                    "cost_price"
                )
            ),

        "current_stock":
            safe_int(
                item.get(
                    "current_stock"
                )
            ),

        "reorder_level":
            safe_int(
                item.get(
                    "reorder_level"
                )
            ),
    }


# ============================================================
# NORMALIZE SUPPLIER
# ============================================================

def normalize_supplier(
    item,
):
    supplier_id = clean_text(
        item.get(
            "supplier_id"
        )
        or
        item.get(
            "supplier_code"
        )
        or
        item.get(
            "id"
        )
        or
        item.get(
            "Supplier_ID"
        )
    )

    supplier_name = clean_text(
        item.get(
            "supplier_name"
        )
        or
        item.get(
            "Supplier_Name"
        )
    )

    status = clean_text(
        item.get(
            "status"
        )
        or
        item.get(
            "Status"
        )
        or
        "Active"
    )

    raw_active = item.get(
        "is_active"
    )

    if raw_active is None:
        is_active = (
            status.lower()
            != "inactive"
        )

    else:
        is_active = safe_bool(
            raw_active
        )

    return {
        "id":
            supplier_id,

        "supplier_id":
            supplier_id,

        "supplier_code":
            supplier_id,

        "supplier_name":
            supplier_name,

        "contact_person":
            clean_text(
                item.get(
                    "contact_person"
                )
                or
                item.get(
                    "Contact_Person"
                )
            ),

        "phone":
            clean_text(
                item.get(
                    "phone"
                )
                or
                item.get(
                    "Phone"
                )
            ),

        "email":
            clean_text(
                item.get(
                    "email"
                )
                or
                item.get(
                    "Email"
                )
            ),

        "address":
            clean_text(
                item.get(
                    "address"
                )
                or
                item.get(
                    "location"
                )
                or
                item.get(
                    "Location"
                )
            ),

        "status":
            status,

        "is_active":
            is_active,
    }


# ============================================================
# NORMALIZE PURCHASE
# ============================================================

def normalize_purchase(
    purchase,
):
    purchase_number = clean_text(
        purchase.get(
            "purchase_number"
        )
        or
        purchase.get(
            "purchase_id"
        )
        or
        purchase.get(
            "id"
        )
    )

    return {
        "id":
            clean_text(
                purchase.get(
                    "id"
                )
                or
                purchase_number
            ),

        "purchase_id":
            clean_text(
                purchase.get(
                    "purchase_id"
                )
                or
                purchase_number
            ),

        "purchase_number":
            purchase_number,

        "supplier_id":
            clean_text(
                purchase.get(
                    "supplier_id"
                )
            ),

        "supplier_name":
            clean_text(
                purchase.get(
                    "supplier_name"
                )
            ),

        "reference_number":
            clean_text(
                purchase.get(
                    "reference_number"
                )
            ),

        "payment_status":
            clean_text(
                purchase.get(
                    "payment_status"
                )
            ),

        "status":
            clean_text(
                purchase.get(
                    "status"
                )
            ),

        "subtotal":
            safe_float(
                purchase.get(
                    "subtotal"
                )
            ),

        "total_amount":
            safe_float(
                purchase.get(
                    "total_amount"
                )
            ),

        "item_count":
            safe_int(
                purchase.get(
                    "item_count"
                )
            ),

        "purchase_date":
            purchase.get(
                "purchase_date"
            ),

        "created_at":
            (
                purchase.get(
                    "created_at"
                )
                or
                purchase.get(
                    "purchase_date"
                )
            ),
    }


# ============================================================
# EXTRACT LIVE DRUGS
# ============================================================

def extract_drugs(
    payload,
):
    raw_drugs = (
        payload.get(
            "drugs"
        )
        or []
    )

    if not isinstance(
        raw_drugs,
        list,
    ):
        raw_drugs = []

    drugs = []

    for item in raw_drugs:
        if not isinstance(
            item,
            dict,
        ):
            continue

        normalized = normalize_drug(
            item
        )

        if not normalized[
            "drug_id"
        ]:
            continue

        drugs.append(
            normalized
        )

    drugs.sort(
        key=lambda item:
            (
                item.get(
                    "drug_name"
                )
                or ""
            ).lower()
    )

    return drugs


# ============================================================
# EXTRACT LIVE SUPPLIERS
# ============================================================

def extract_suppliers(
    payload,
):
    raw_suppliers = (
        payload.get(
            "suppliers"
        )
        or []
    )

    if not isinstance(
        raw_suppliers,
        list,
    ):
        raw_suppliers = []

    suppliers = []

    for item in raw_suppliers:
        if not isinstance(
            item,
            dict,
        ):
            continue

        normalized = normalize_supplier(
            item
        )

        if not normalized[
            "supplier_id"
        ]:
            continue

        if not normalized[
            "supplier_name"
        ]:
            continue

        suppliers.append(
            normalized
        )

    suppliers.sort(
        key=lambda item:
            (
                item.get(
                    "supplier_name"
                )
                or ""
            ).lower()
    )

    return suppliers


# ============================================================
# EXTRACT LIVE PURCHASES
# ============================================================

def extract_purchases(
    payload,
):
    raw_purchases = (
        payload.get(
            "purchases"
        )
        or []
    )

    if not isinstance(
        raw_purchases,
        list,
    ):
        raw_purchases = []

    purchases = []

    for item in raw_purchases:
        if not isinstance(
            item,
            dict,
        ):
            continue

        normalized = normalize_purchase(
            item
        )

        if not normalized[
            "purchase_id"
        ]:
            continue

        purchases.append(
            normalized
        )

    return purchases


# ============================================================
# FIND SUPPLIER
# ============================================================

def find_supplier_by_id(
    suppliers,
    supplier_id,
):
    target = clean_text(
        supplier_id
    ).lower()

    for supplier in suppliers:
        current = clean_text(
            supplier.get(
                "supplier_id"
            )
        ).lower()

        if current == target:
            return supplier

    return None


# ============================================================
# PURCHASE DRUGS
# LIVE GOOGLE SHEETS
# ============================================================

@router.get(
    "/drugs"
)
def get_purchase_drugs(
    current_admin: User = Depends(
        get_current_admin
    ),
):
    try:
        payload = (
            get_google_purchase_data()
        )

        drugs = extract_drugs(
            payload
        )

        return {
            "source":
                payload.get(
                    "source",
                    "google-sheets",
                ),

            "generated_at":
                payload.get(
                    "generated_at"
                ),

            "drugs":
                drugs,

            "count":
                len(
                    drugs
                ),
        }

    except RuntimeError as error:
        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to load live purchase medicines "
                "from Google Sheets: "
                + str(error)
            ),
        )

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Purchase medicine loading failed: "
                + str(error)
            ),
        )


# ============================================================
# PURCHASE SUPPLIERS
#
# These are supplier businesses/people who provide stock
# TO Dr. Evans Pharmacy.
#
# They are NOT patients/customers.
# ============================================================

@router.get(
    "/suppliers"
)
def get_purchase_suppliers(
    current_admin: User = Depends(
        get_current_admin
    ),
):
    try:
        payload = (
            get_google_purchase_data()
        )

        suppliers = extract_suppliers(
            payload
        )

        active_suppliers = [
            supplier
            for supplier in suppliers
            if supplier.get(
                "is_active"
            )
        ]

        return {
            "source":
                payload.get(
                    "source",
                    "google-sheets",
                ),

            "generated_at":
                payload.get(
                    "generated_at"
                ),

            "suppliers":
                active_suppliers,

            "count":
                len(
                    active_suppliers
                ),
        }

    except RuntimeError as error:
        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to load suppliers "
                "for purchases from Google Sheets: "
                + str(error)
            ),
        )

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Purchase supplier loading failed: "
                + str(error)
            ),
        )


# ============================================================
# CREATE PURCHASE
#
# BUSINESS FLOW:
#
# Existing Active Supplier
#         ↓
#     Purchase
#         ↓
#  Purchase Items
#         ↓
# Inventory increases
#
# This endpoint NEVER creates suppliers.
# ============================================================

@router.post(
    ""
)
def create_purchase(
    request: PurchaseCreateRequest,
    current_admin: User = Depends(
        get_current_admin
    ),
):
    supplier_id = (
        request.supplier_id
        .strip()
    )

    if not supplier_id:
        raise HTTPException(
            status_code=400,
            detail=(
                "Please select a supplier."
            ),
        )

    if not request.items:
        raise HTTPException(
            status_code=400,
            detail=(
                "Purchase must contain at least one medicine."
            ),
        )

    # --------------------------------------------------------
    # Load current supplier list BEFORE posting.
    # This verifies that supplier exists and is active.
    # It also gives us the list of purchase IDs before POST,
    # which is useful if Google's response redirect is broken.
    # --------------------------------------------------------

    try:
        before_payload = (
            get_google_purchase_data()
        )

    except RuntimeError as error:
        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to verify supplier before purchase: "
                + str(error)
            ),
        )

    suppliers = extract_suppliers(
        before_payload
    )

    supplier = find_supplier_by_id(
        suppliers,
        supplier_id,
    )

    if not supplier:
        raise HTTPException(
            status_code=400,
            detail=(
                "Selected supplier was not found. "
                "Add the supplier from the Suppliers page first."
            ),
        )

    if not supplier.get(
        "is_active"
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Selected supplier is inactive. "
                "Reactivate the supplier before recording a purchase."
            ),
        )

    previous_purchases = (
        extract_purchases(
            before_payload
        )
    )

    previous_purchase_ids = {
        clean_text(
            purchase.get(
                "purchase_id"
            )
        )
        for purchase in previous_purchases
        if clean_text(
            purchase.get(
                "purchase_id"
            )
        )
    }

    # --------------------------------------------------------
    # Validate purchase items
    # --------------------------------------------------------

    items = []

    for requested_item in request.items:
        drug_id = (
            requested_item.drug_id
            .strip()
        )

        if not drug_id:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Every purchase item must contain "
                    "a valid Drug ID."
                ),
            )

        item_payload = {
            "drug_id":
                drug_id,

            "quantity":
                requested_item.quantity,
        }

        if (
            requested_item.unit_cost
            is not None
        ):
            item_payload[
                "unit_cost"
            ] = float(
                requested_item.unit_cost
            )

        items.append(
            item_payload
        )

    reference_number = (
        request.reference_number.strip()
        if request.reference_number
        else ""
    )

    payment_status = (
        request.payment_status.strip()
        if request.payment_status
        else "pending"
    )

    payload = {
        # CRITICAL:
        # We send Supplier_ID, not a typed supplier name.
        "supplier_id":
            supplier_id,

        "reference_number":
            reference_number,

        "payment_status":
            payment_status,

        "created_by":
            str(
                current_admin.id
            ),

        "items":
            items,
    }

    try:
        result = google_post_raw(
            "admin-purchase-create",
            payload,
        )

        # ----------------------------------------------------
        # Normal JSON success response
        # ----------------------------------------------------

        returned_purchase = (
            result.get(
                "purchase"
            )
            if isinstance(
                result,
                dict,
            )
            else None
        )

        if isinstance(
            returned_purchase,
            dict,
        ):
            purchase = (
                normalize_purchase(
                    returned_purchase
                )
            )

            return {
                "message":
                    (
                        result.get(
                            "message"
                        )
                        or
                        "Purchase recorded successfully."
                    ),

                "source":
                    "google-sheets",

                "purchase":
                    purchase,
            }

        # ----------------------------------------------------
        # Apps Script response was unreadable/404.
        #
        # DO NOT POST AGAIN.
        # Posting twice could double the inventory.
        #
        # Instead reload purchase history and verify that a new
        # purchase was created.
        # ----------------------------------------------------

        after_payload = (
            get_google_purchase_data()
        )

        purchases_after = (
            extract_purchases(
                after_payload
            )
        )

        new_purchases = [
            purchase
            for purchase in purchases_after
            if clean_text(
                purchase.get(
                    "purchase_id"
                )
            )
            not in previous_purchase_ids
        ]

        matching_purchases = [
            purchase
            for purchase in new_purchases
            if clean_text(
                purchase.get(
                    "supplier_id"
                )
            ).lower()
            == supplier_id.lower()
        ]

        # If reference number was supplied, use it for even
        # stronger verification.
        if reference_number:
            reference_matches = [
                purchase
                for purchase in matching_purchases
                if clean_text(
                    purchase.get(
                        "reference_number"
                    )
                ).lower()
                == reference_number.lower()
            ]

            if reference_matches:
                matching_purchases = (
                    reference_matches
                )

        if matching_purchases:
            created_purchase = (
                matching_purchases[0]
            )

            return {
                "message":
                    "Purchase recorded successfully.",

                "source":
                    "google-sheets",

                "purchase":
                    created_purchase,
            }

        raise RuntimeError(
            (
                "Google Apps Script did not return a readable "
                "purchase response and the new purchase could "
                "not be verified in Google Sheets."
            )
        )

    except HTTPException:
        raise

    except RuntimeError as error:
        message = str(
            error
        )

        lowered = (
            message.lower()
        )

        # These are business validation errors from Apps Script,
        # not server failures.
        if (
            "supplier" in lowered
            and (
                "not found" in lowered
                or
                "inactive" in lowered
                or
                "select" in lowered
            )
        ):
            raise HTTPException(
                status_code=400,
                detail=message,
            )

        if (
            "drug not found"
            in lowered
            or
            "quantity"
            in lowered
        ):
            raise HTTPException(
                status_code=400,
                detail=message,
            )

        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to record purchase "
                "in Google Sheets: "
                + message
            ),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Purchase creation failed: "
                + str(error)
            ),
        )


# ============================================================
# PURCHASE HISTORY
# LIVE GOOGLE SHEETS
# ============================================================

@router.get(
    ""
)
def get_purchases(
    current_admin: User = Depends(
        get_current_admin
    ),
):
    try:
        payload = (
            get_google_purchase_data()
        )

        purchases = (
            extract_purchases(
                payload
            )
        )

        suppliers = (
            extract_suppliers(
                payload
            )
        )

        active_suppliers = [
            supplier
            for supplier in suppliers
            if supplier.get(
                "is_active"
            )
        ]

        return {
            "source":
                payload.get(
                    "source",
                    "google-sheets",
                ),

            "generated_at":
                payload.get(
                    "generated_at"
                ),

            "purchases":
                purchases,

            # This will let the frontend build the proper
            # "Select Supplier" dropdown.
            "suppliers":
                active_suppliers,

            "count":
                len(
                    purchases
                ),
        }

    except RuntimeError as error:
        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to load purchase history "
                "from Google Sheets: "
                + str(error)
            ),
        )

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Purchase history loading failed: "
                + str(error)
            ),
        )