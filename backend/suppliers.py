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

from pydantic import BaseModel
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
    prefix="/admin/suppliers",
    tags=["Admin Suppliers"],
)


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
            detail=(
                "Invalid or expired token."
            ),
        )

    if not payload:
        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid or expired token."
            ),
        )

    user_id = payload.get(
        "sub"
    )

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid token payload."
            ),
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
            detail=(
                "Invalid token payload."
            ),
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
            detail=(
                "User not found."
            ),
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail=(
                "User account is inactive."
            ),
        )

    role = str(
        user.role or ""
    ).strip().lower()

    if role != "admin":
        raise HTTPException(
            status_code=403,
            detail=(
                "Administrator access required."
            ),
        )

    return user


# ============================================================
# REQUEST MODELS
# ============================================================

class SupplierCreateRequest(
    BaseModel
):
    supplier_name: str

    contact_person: str | None = None

    phone: str | None = None

    email: str | None = None

    address: str | None = None

    notes: str | None = None


class SupplierStatusUpdate(
    BaseModel
):
    is_active: bool


# ============================================================
# CONFIG VALIDATION
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
# SMALL HELPERS
# ============================================================

def clean_text(
    value,
):
    return str(
        value or ""
    ).strip()


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


# ============================================================
# NORMALIZE SUPPLIER
# ============================================================

def normalize_supplier(
    supplier,
):
    if not isinstance(
        supplier,
        dict,
    ):
        supplier = {}

    supplier_id = clean_text(
        supplier.get(
            "supplier_id"
        )
        or
        supplier.get(
            "supplier_code"
        )
        or
        supplier.get(
            "id"
        )
    )

    status = clean_text(
        supplier.get(
            "status"
        )
    )

    raw_active = supplier.get(
        "is_active"
    )

    if isinstance(
        raw_active,
        bool,
    ):
        is_active = raw_active

    elif raw_active is not None:
        is_active = (
            str(
                raw_active
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

    else:
        is_active = (
            status.lower()
            != "inactive"
        )

    if not status:
        status = (
            "Active"
            if is_active
            else "Inactive"
        )

    return {
        "id":
            supplier_id,

        "supplier_id":
            supplier_id,

        "supplier_code":
            clean_text(
                supplier.get(
                    "supplier_code"
                )
                or
                supplier_id
            ),

        "supplier_name":
            clean_text(
                supplier.get(
                    "supplier_name"
                )
            ),

        "contact_person":
            clean_text(
                supplier.get(
                    "contact_person"
                )
            ),

        "phone":
            clean_text(
                supplier.get(
                    "phone"
                )
            ),

        "email":
            clean_text(
                supplier.get(
                    "email"
                )
            ),

        "address":
            clean_text(
                supplier.get(
                    "address"
                )
                or
                supplier.get(
                    "location"
                )
            ),

        "location":
            clean_text(
                supplier.get(
                    "location"
                )
                or
                supplier.get(
                    "address"
                )
            ),

        "notes":
            clean_text(
                supplier.get(
                    "notes"
                )
            ),

        "status":
            status,

        "is_active":
            is_active,

        "purchase_count":
            safe_int(
                supplier.get(
                    "purchase_count"
                )
            ),

        "created_at":
            supplier.get(
                "created_at"
            ),
    }


# ============================================================
# PARSE NORMAL JSON RESPONSE
# ============================================================

def parse_json_response(
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
            else
            "No response body."
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

            return parse_json_response(
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
# MANUAL GOOGLE POST
#
# IMPORTANT:
# Apps Script ContentService may return a redirect after the
# POST has ALREADY successfully changed the spreadsheet.
# We therefore do not blindly treat that redirect as failure.
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
        return parse_json_response(
            response,
            action,
        )

    # --------------------------------------------------------
    # Apps Script ContentService redirect
    # --------------------------------------------------------

    if response.status_code in {
        301,
        302,
        303,
        307,
        308,
    }:
        location = (
            response.headers.get(
                "Location"
            )
            or ""
        ).strip()

        if location:
            try:
                redirected = session.get(
                    location,
                    timeout=GOOGLE_REQUEST_TIMEOUT,
                    allow_redirects=True,
                )

                if redirected.ok:
                    text = (
                        redirected.text
                        or ""
                    ).strip()

                    if text:
                        try:
                            data = (
                                redirected.json()
                            )

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

        # The POST may already have succeeded.
        return {
            "ok":
                True,

            "_post_redirect_unreadable":
                True,
        }

    # --------------------------------------------------------
    # Some Google deployments occasionally return a Google
    # HTML error page after the script has already executed.
    # Verification will determine whether it succeeded.
    # --------------------------------------------------------

    if response.status_code == 404:
        return {
            "ok":
                True,

            "_post_redirect_unreadable":
                True,

            "_post_status":
                404,
        }

    preview = (
        response.text[:300]
        if response.text
        else
        "No response body."
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
# LOAD LIVE SUPPLIERS
# ============================================================

def load_live_suppliers():
    payload = google_get(
        "admin-suppliers"
    )

    raw_suppliers = (
        payload.get(
            "suppliers"
        )
        or []
    )

    suppliers = []

    if not isinstance(
        raw_suppliers,
        list,
    ):
        raw_suppliers = []

    for supplier in raw_suppliers:
        if not isinstance(
            supplier,
            dict,
        ):
            continue

        normalized = (
            normalize_supplier(
                supplier
            )
        )

        if not normalized[
            "supplier_id"
        ]:
            continue

        suppliers.append(
            normalized
        )

    suppliers.sort(
        key=lambda supplier:
            (
                supplier.get(
                    "supplier_name"
                )
                or ""
            ).lower()
    )

    return (
        payload,
        suppliers,
    )


# ============================================================
# FIND SUPPLIER BY NAME
# ============================================================

def find_supplier_by_name(
    suppliers,
    supplier_name,
):
    target = (
        supplier_name
        .strip()
        .lower()
    )

    for supplier in suppliers:
        current = (
            supplier.get(
                "supplier_name"
            )
            or ""
        ).strip().lower()

        if current == target:
            return supplier

    return None


# ============================================================
# FIND SUPPLIER BY ID
# ============================================================

def find_supplier_by_id(
    suppliers,
    supplier_id,
):
    target = (
        str(
            supplier_id
        )
        .strip()
        .lower()
    )

    for supplier in suppliers:
        candidate = (
            supplier.get(
                "supplier_id"
            )
            or
            supplier.get(
                "supplier_code"
            )
            or
            supplier.get(
                "id"
            )
            or ""
        )

        if (
            str(
                candidate
            )
            .strip()
            .lower()
            == target
        ):
            return supplier

    return None


# ============================================================
# GET SUPPLIERS
# ============================================================

@router.get(
    ""
)
def get_suppliers(
    current_admin: User = Depends(
        get_current_admin
    ),
):
    try:
        payload, suppliers = (
            load_live_suppliers()
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

            "suppliers":
                suppliers,

            "count":
                len(
                    suppliers
                ),

            "active_count":
                sum(
                    1
                    for supplier
                    in suppliers
                    if supplier[
                        "is_active"
                    ]
                ),

            "inactive_count":
                sum(
                    1
                    for supplier
                    in suppliers
                    if not supplier[
                        "is_active"
                    ]
                ),
        }

    except RuntimeError as error:
        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to load suppliers "
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
                "Supplier loading failed: "
                + str(error)
            ),
        )


# ============================================================
# CREATE SUPPLIER
# ============================================================

@router.post(
    ""
)
def create_supplier(
    request: SupplierCreateRequest,
    current_admin: User = Depends(
        get_current_admin
    ),
):
    supplier_name = (
        request.supplier_name
        .strip()
    )

    if not supplier_name:
        raise HTTPException(
            status_code=400,
            detail=(
                "Supplier name is required."
            ),
        )

    # --------------------------------------------------------
    # Check live sheet first so duplicate handling is clean.
    # --------------------------------------------------------

    try:
        _, existing_suppliers = (
            load_live_suppliers()
        )

    except Exception:
        existing_suppliers = []

    existing = (
        find_supplier_by_name(
            existing_suppliers,
            supplier_name,
        )
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail=(
                "Supplier already exists."
            ),
        )

    payload = {
        "supplier_name":
            supplier_name,

        "contact_person":
            (
                request.contact_person.strip()
                if request.contact_person
                else ""
            ),

        "phone":
            (
                request.phone.strip()
                if request.phone
                else ""
            ),

        "email":
            (
                request.email.strip()
                if request.email
                else ""
            ),

        "address":
            (
                request.address.strip()
                if request.address
                else ""
            ),

        "notes":
            (
                request.notes.strip()
                if request.notes
                else ""
            ),

        "created_by":
            str(
                current_admin.id
            ),
    }

    try:
        result = google_post_raw(
            "admin-supplier-create",
            payload,
        )

        # ----------------------------------------------------
        # Normal readable JSON result
        # ----------------------------------------------------

        returned_supplier = (
            result.get(
                "supplier"
            )
            if isinstance(
                result,
                dict,
            )
            else None
        )

        if isinstance(
            returned_supplier,
            dict,
        ):
            normalized = (
                normalize_supplier(
                    returned_supplier
                )
            )

            return {
                "message":
                    (
                        result.get(
                            "message"
                        )
                        or
                        "Supplier created successfully."
                    ),

                "source":
                    "google-sheets",

                "supplier":
                    normalized,
            }

        # ----------------------------------------------------
        # Redirect response could not be read.
        # Verify that Google actually created the supplier.
        # ----------------------------------------------------

        _, suppliers_after = (
            load_live_suppliers()
        )

        created_supplier = (
            find_supplier_by_name(
                suppliers_after,
                supplier_name,
            )
        )

        if not created_supplier:
            raise RuntimeError(
                (
                    "Google Apps Script did not return "
                    "a readable create response and the "
                    "supplier could not be verified in "
                    "Google Sheets."
                )
            )

        return {
            "message":
                "Supplier created successfully.",

            "source":
                "google-sheets",

            "supplier":
                created_supplier,
        }

    except HTTPException:
        raise

    except RuntimeError as error:
        message = str(
            error
        )

        if (
            "already exists"
            in message.lower()
        ):
            raise HTTPException(
                status_code=400,
                detail=message,
            )

        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to create supplier "
                "in Google Sheets: "
                + message
            ),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Supplier creation failed: "
                + str(error)
            ),
        )


# ============================================================
# UPDATE SUPPLIER STATUS
# ============================================================

@router.patch(
    "/{supplier_id}/status"
)
def update_supplier_status(
    supplier_id: str,
    request: SupplierStatusUpdate,
    current_admin: User = Depends(
        get_current_admin
    ),
):
    clean_supplier_id = (
        supplier_id.strip()
    )

    if not clean_supplier_id:
        raise HTTPException(
            status_code=400,
            detail=(
                "Supplier ID is required."
            ),
        )

    # --------------------------------------------------------
    # Verify supplier exists before sending the change.
    # --------------------------------------------------------

    try:
        _, suppliers_before = (
            load_live_suppliers()
        )

    except RuntimeError as error:
        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to verify supplier "
                "before status update: "
                + str(error)
            ),
        )

    existing_supplier = (
        find_supplier_by_id(
            suppliers_before,
            clean_supplier_id,
        )
    )

    if not existing_supplier:
        raise HTTPException(
            status_code=404,
            detail=(
                "Supplier not found."
            ),
        )

    try:
        result = google_post_raw(
            "admin-supplier-status",
            {
                "supplier_id":
                    clean_supplier_id,

                "is_active":
                    request.is_active,

                "updated_by":
                    str(
                        current_admin.id
                    ),
            },
        )

        # ----------------------------------------------------
        # If Google returned readable JSON, use it.
        # ----------------------------------------------------

        returned_supplier = (
            result.get(
                "supplier"
            )
            if isinstance(
                result,
                dict,
            )
            else None
        )

        if isinstance(
            returned_supplier,
            dict,
        ):
            normalized = (
                normalize_supplier(
                    returned_supplier
                )
            )

            return {
                "message":
                    (
                        result.get(
                            "message"
                        )
                        or
                        "Supplier status updated successfully."
                    ),

                "source":
                    "google-sheets",

                "supplier":
                    normalized,
            }

        # ----------------------------------------------------
        # Otherwise verify actual Sheet state.
        # ----------------------------------------------------

        _, suppliers_after = (
            load_live_suppliers()
        )

        updated_supplier = (
            find_supplier_by_id(
                suppliers_after,
                clean_supplier_id,
            )
        )

        if not updated_supplier:
            raise RuntimeError(
                "Supplier disappeared after status update."
            )

        if (
            updated_supplier[
                "is_active"
            ]
            != request.is_active
        ):
            raise RuntimeError(
                (
                    "Supplier status could not be verified "
                    "after the Google Apps Script request."
                )
            )

        return {
            "message":
                "Supplier status updated successfully.",

            "source":
                "google-sheets",

            "supplier":
                updated_supplier,
        }

    except HTTPException:
        raise

    except RuntimeError as error:
        message = str(
            error
        )

        if (
            "not found"
            in message.lower()
        ):
            raise HTTPException(
                status_code=404,
                detail=message,
            )

        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to update supplier status "
                "in Google Sheets: "
                + message
            ),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Supplier status update failed: "
                + str(error)
            ),
        )