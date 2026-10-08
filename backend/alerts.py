import copy
import threading
import time

from concurrent.futures import (
    ThreadPoolExecutor,
    as_completed,
)

from datetime import (
    date,
    datetime,
    timezone,
)

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

from inventory_sync import (
    post_google_action_data,
)

from reports import (
    clean_text,
    extract_dashboard_inventory,
    extract_google_purchases,
    extract_google_sales,
    first_value,
    require_google_dashboard_data,
    require_google_purchases_data,
    require_google_sales_data,
)

from security import decode_access_token


# =========================================================
# OPTIONAL APPOINTMENT MODEL
# =========================================================

try:
    from appointment_models import Appointment

except ImportError:
    try:
        from models import Appointment

    except ImportError:
        Appointment = None


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/admin/alerts",
    tags=["Admin Alerts"],
)

security = HTTPBearer()


# =========================================================
# ALERT / REFILL RULES
# =========================================================

ALERT_CACHE_TTL_SECONDS = 20

REFILL_OVERDUE_MAX_DAYS = 7


REFILL_TERMINAL_PATIENT_RESPONSES = {
    "confirmed",
    "cancelled",
    "cancelled by patient",
    "patient cancelled",
    "patient-cancelled",
}


REFILL_TERMINAL_CONFIRMATION_STATUSES = {
    "confirmed",
    "completed",
}


REFILL_TERMINAL_RESOLUTION_STATUSES = {
    "cancelled by patient",
    "patient cancelled",
    "clinically declined",
    "clinical decline",
    "declined on clinical review",
    "completed",
    "closed",
}


# =========================================================
# CACHE
# =========================================================

_ALERT_CACHE = {
    "loaded_at": 0.0,
    "data": None,
}

_ALERT_CACHE_LOCK = threading.Lock()


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

    role = clean_text(
        user.role
    ).lower()

    if role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Administrator access required.",
        )

    return user


# =========================================================
# CACHE HELPERS
# =========================================================

def alert_cache_is_fresh():
    data = _ALERT_CACHE.get(
        "data"
    )

    if data is None:
        return False

    loaded_at = float(
        _ALERT_CACHE.get(
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
        ALERT_CACHE_TTL_SECONDS
    )


def get_cached_alerts():
    if not alert_cache_is_fresh():
        return None

    return copy.deepcopy(
        _ALERT_CACHE[
            "data"
        ]
    )


def set_cached_alerts(
    data,
):
    _ALERT_CACHE[
        "loaded_at"
    ] = time.monotonic()

    _ALERT_CACHE[
        "data"
    ] = copy.deepcopy(
        data
    )

    return copy.deepcopy(
        data
    )


def invalidate_alert_cache():
    """
    Clear the admin alert cache immediately.

    This is called after successful admin refill actions so
    a subsequent frontend reload gets fresh Google Sheet data.
    """

    with _ALERT_CACHE_LOCK:
        _ALERT_CACHE[
            "loaded_at"
        ] = 0.0

        _ALERT_CACHE[
            "data"
        ] = None


# =========================================================
# DATE HELPERS
# =========================================================

def parse_date_value(
    value,
):
    if value is None:
        return None

    if isinstance(
        value,
        datetime,
    ):
        return value.date()

    if isinstance(
        value,
        date,
    ):
        return value

    text = clean_text(
        value
    )

    if not text:
        return None

    formats = [
        "%Y-%m-%d",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%S.%f",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%S.%f%z",
        "%d/%m/%Y",
        "%d-%m-%Y",
        "%m/%d/%Y",
        "%b %d, %Y",
        "%B %d, %Y",
    ]

    for pattern in formats:
        try:
            return datetime.strptime(
                text,
                pattern,
            ).date()

        except ValueError:
            continue

    if text.endswith(
        "Z"
    ):
        try:
            return datetime.fromisoformat(
                text.replace(
                    "Z",
                    "+00:00",
                )
            ).date()

        except ValueError:
            pass

    try:
        return datetime.fromisoformat(
            text
        ).date()

    except ValueError:
        return None


def serialize_datetime(
    value,
):
    if value is None:
        return None

    if isinstance(
        value,
        datetime,
    ):
        if value.tzinfo is None:
            return value.isoformat()

        return value.astimezone(
            timezone.utc
        ).isoformat()

    if isinstance(
        value,
        date,
    ):
        return datetime.combine(
            value,
            datetime.min.time(),
        ).isoformat()

    text = clean_text(
        value
    )

    return text or None


# =========================================================
# ALERT HELPERS
# =========================================================

def make_alert(
    *,
    alert_type,
    severity,
    title,
    message,
    created_at=None,
    **extra,
):
    alert = {
        "type":
            alert_type,

        "severity":
            severity,

        "title":
            title,

        "message":
            message,

        "created_at":
            serialize_datetime(
                created_at
            ),
    }

    alert.update(
        extra
    )

    return alert


def severity_rank(
    alert,
):
    severity = clean_text(
        alert.get(
            "severity"
        )
    ).lower()

    ranks = {
        "critical": 0,
        "warning": 1,
        "info": 2,
    }

    return ranks.get(
        severity,
        3,
    )


def created_at_rank(
    alert,
):
    value = alert.get(
        "created_at"
    )

    if not value:
        return 0.0

    try:
        parsed = datetime.fromisoformat(
            str(value).replace(
                "Z",
                "+00:00",
            )
        )

        if parsed.tzinfo is None:
            parsed = parsed.replace(
                tzinfo=timezone.utc
            )

        return parsed.timestamp()

    except (
        TypeError,
        ValueError,
    ):
        return 0.0


def sort_alerts(
    alerts,
):
    return sorted(
        alerts,
        key=lambda alert: (
            severity_rank(
                alert
            ),
            -created_at_rank(
                alert
            ),
            clean_text(
                alert.get(
                    "title"
                )
            ).lower(),
        ),
    )


# =========================================================
# INVENTORY ALERTS
# =========================================================

def build_inventory_alerts(
    dashboard_data,
):
    alerts = []

    inventory = (
        extract_dashboard_inventory(
            dashboard_data
        )
    )

    for item in inventory:
        stock_quantity = int(
            item.get(
                "stock_quantity",
                0,
            )
            or 0
        )

        reorder_level = int(
            item.get(
                "reorder_level",
                0,
            )
            or 0
        )

        drug_name = (
            clean_text(
                item.get(
                    "drug_name"
                )
            )
            or
            "Medicine"
        )

        drug_id = clean_text(
            item.get(
                "drug_id"
            )
        )

        status = clean_text(
            item.get(
                "status"
            )
        ).lower()

        if (
            stock_quantity <= 0
            or
            status == "out of stock"
        ):
            alerts.append(
                make_alert(
                    alert_type="inventory",
                    severity="critical",
                    title="Out of Stock",
                    message=(
                        f"{drug_name} is out of stock "
                        "and requires restocking."
                    ),
                    drug_id=drug_id,
                    stock_quantity=stock_quantity,
                    reorder_level=reorder_level,
                )
            )

            continue

        if (
            stock_quantity
            <=
            reorder_level
            or
            status == "low stock"
        ):
            alerts.append(
                make_alert(
                    alert_type="inventory",
                    severity="warning",
                    title="Low Stock",
                    message=(
                        f"{drug_name} has "
                        f"{stock_quantity} units remaining. "
                        f"Reorder level is {reorder_level}."
                    ),
                    drug_id=drug_id,
                    stock_quantity=stock_quantity,
                    reorder_level=reorder_level,
                )
            )

    return alerts


# =========================================================
# REFILL DATA
# =========================================================

def extract_dashboard_refills(
    dashboard_data,
):
    candidates = [
        dashboard_data.get(
            "refills"
        ),

        dashboard_data.get(
            "Refills"
        ),

        dashboard_data.get(
            "refill_records"
        ),

        dashboard_data.get(
            "refill_alerts"
        ),
    ]

    for candidate in candidates:
        if isinstance(
            candidate,
            list,
        ):
            return candidate

    return []


# =========================================================
# REFILL RESOLUTION HELPERS
# =========================================================

def refill_terminal_status(
    refill,
):
    patient_response = clean_text(
        first_value(
            refill,
            "patient_response",
            "Patient_Response",
            default="",
        )
    ).lower()

    confirmation_status = clean_text(
        first_value(
            refill,
            "confirmation_status",
            "Confirmation_Status",
            default="",
        )
    ).lower()

    generated_order_id = clean_text(
        first_value(
            refill,
            "generated_order_id",
            "Generated_Order_ID",
            default="",
        )
    )

    resolution_status = clean_text(
        first_value(
            refill,
            "resolution_status",
            "Resolution_Status",
            "review_status",
            "Review_Status",
            "decision_status",
            "Decision_Status",
            default="",
        )
    ).lower()

    if generated_order_id:
        return True

    if (
        patient_response
        in
        REFILL_TERMINAL_PATIENT_RESPONSES
    ):
        return True

    if (
        confirmation_status
        in
        REFILL_TERMINAL_CONFIRMATION_STATUSES
    ):
        return True

    if (
        resolution_status
        in
        REFILL_TERMINAL_RESOLUTION_STATUSES
    ):
        return True

    return False


def refill_review_reason(
    refill,
):
    return clean_text(
        first_value(
            refill,
            "resolution_reason",
            "Resolution_Reason",
            "review_reason",
            "Review_Reason",
            "decision_reason",
            "Decision_Reason",
            "clinical_reason",
            "Clinical_Reason",
            "patient_cancellation_reason",
            "Patient_Cancellation_Reason",
            default="",
        )
    )


def refill_review_note(
    refill,
):
    return clean_text(
        first_value(
            refill,
            "pharmacist_note",
            "Pharmacist_Note",
            "clinical_note",
            "Clinical_Note",
            "review_note",
            "Review_Note",
            default="",
        )
    )


# =========================================================
# REFILL ALERTS
# =========================================================

def build_refill_alerts(
    dashboard_data,
):
    alerts = []

    refills = (
        extract_dashboard_refills(
            dashboard_data
        )
    )

    patients = (
        dashboard_data.get(
            "patients"
        )
        or
        dashboard_data.get(
            "Patients"
        )
        or
        []
    )

    drugs = (
        dashboard_data.get(
            "drugs"
        )
        or
        dashboard_data.get(
            "Drugs"
        )
        or
        []
    )

    patient_names = {}

    if isinstance(
        patients,
        list,
    ):
        for patient in patients:
            if not isinstance(
                patient,
                dict,
            ):
                continue

            patient_id = clean_text(
                first_value(
                    patient,
                    "patient_id",
                    "Patient_ID",
                    default="",
                )
            )

            patient_name = clean_text(
                first_value(
                    patient,
                    "full_name",
                    "Full_Name",
                    "name",
                    default="",
                )
            )

            if patient_id:
                patient_names[
                    patient_id
                ] = patient_name

    drug_names = {}

    if isinstance(
        drugs,
        list,
    ):
        for drug in drugs:
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

            drug_name = clean_text(
                first_value(
                    drug,
                    "drug_name",
                    "Drug_Name",
                    "name",
                    default="",
                )
            )

            if drug_id:
                drug_names[
                    drug_id
                ] = drug_name

    today = date.today()

    for refill in refills:
        if not isinstance(
            refill,
            dict,
        ):
            continue

        # ---------------------------------------------
        # Skip completed / closed refill records.
        # ---------------------------------------------

        if refill_terminal_status(
            refill
        ):
            continue

        refill_id = clean_text(
            first_value(
                refill,
                "refill_id",
                "Refill_ID",
                default="",
            )
        )

        patient_id = clean_text(
            first_value(
                refill,
                "patient_id",
                "Patient_ID",
                default="",
            )
        )

        drug_id = clean_text(
            first_value(
                refill,
                "drug_id",
                "Drug_ID",
                default="",
            )
        )

        patient_name = (
            clean_text(
                first_value(
                    refill,
                    "patient_name",
                    "Patient_Name",
                    default="",
                )
            )
            or
            patient_names.get(
                patient_id,
                ""
            )
            or
            patient_id
            or
            "Patient"
        )

        drug_name = (
            clean_text(
                first_value(
                    refill,
                    "drug_name",
                    "Drug_Name",
                    default="",
                )
            )
            or
            drug_names.get(
                drug_id,
                ""
            )
            or
            drug_id
            or
            "medication"
        )

        next_refill_value = first_value(
            refill,
            "next_refill_date",
            "Next_Refill_Date",
            default=None,
        )

        next_refill_date = (
            parse_date_value(
                next_refill_value
            )
        )

        if not next_refill_date:
            continue

        days_late = (
            today
            -
            next_refill_date
        ).days

        reason = refill_review_reason(
            refill
        )

        pharmacist_note = refill_review_note(
            refill
        )

        common_fields = {
            "refill_id":
                refill_id,

            "patient_id":
                patient_id,

            "patient_name":
                patient_name,

            "drug_id":
                drug_id,

            "drug_name":
                drug_name,

            "next_refill_date":
                serialize_datetime(
                    next_refill_value
                ),

            "days_late":
                max(
                    days_late,
                    0,
                ),

            "resolution_reason":
                reason,

            "pharmacist_note":
                pharmacist_note,
        }

        # ---------------------------------------------
        # DUE TODAY
        # ---------------------------------------------

        if days_late == 0:
            alerts.append(
                make_alert(
                    alert_type="refill",
                    severity="warning",
                    title="Refill Due Today",
                    message=(
                        f"{patient_name}'s refill for "
                        f"{drug_name} is due today."
                    ),
                    created_at=next_refill_value,
                    refill_status="Due Today",
                    review_required=False,
                    allowed_actions=[
                        "confirm",
                        "contact_patient",
                    ],
                    **common_fields,
                )
            )

            continue

        # ---------------------------------------------
        # FUTURE REFILL
        # ---------------------------------------------

        if days_late < 0:
            continue

        # ---------------------------------------------
        # OVERDUE: 1–7 DAYS
        # ---------------------------------------------

        if (
            1
            <=
            days_late
            <=
            REFILL_OVERDUE_MAX_DAYS
        ):
            day_word = (
                "day"
                if days_late == 1
                else "days"
            )

            alerts.append(
                make_alert(
                    alert_type="refill",
                    severity="critical",
                    title="Overdue Refill",
                    message=(
                        f"{patient_name}'s refill for "
                        f"{drug_name} is {days_late} "
                        f"{day_word} overdue."
                    ),
                    created_at=next_refill_value,
                    refill_status="Overdue",
                    review_required=False,
                    allowed_actions=[
                        "contact_patient",
                        "confirm",
                        "review",
                    ],
                    **common_fields,
                )
            )

            continue

        # ---------------------------------------------
        # MISSED / EXPIRED: 8+ DAYS
        # ---------------------------------------------

        if (
            days_late
            >
            REFILL_OVERDUE_MAX_DAYS
        ):
            alerts.append(
                make_alert(
                    alert_type="refill",
                    severity="critical",
                    title="Missed / Expired Refill",
                    message=(
                        f"{patient_name}'s refill for "
                        f"{drug_name} is {days_late} days late "
                        "and requires pharmacist review."
                    ),
                    created_at=next_refill_value,
                    refill_status="Missed / Expired",
                    review_required=True,
                    allowed_actions=[
                        "review",
                        "reschedule",
                        "patient_cancelled",
                        "clinically_declined",
                    ],
                    **common_fields,
                )
            )

    return alerts


# =========================================================
# LATEST SALE
# =========================================================

def build_latest_sale_alert(
    sales_data,
):
    sales = (
        extract_google_sales(
            sales_data
        )
    )

    if not sales:
        return None

    latest_sale = sales[0]

    order_number = (
        clean_text(
            latest_sale.get(
                "sale_number"
            )
        )
        or
        clean_text(
            latest_sale.get(
                "order_id"
            )
        )
        or
        "Latest order"
    )

    patient_name = (
        clean_text(
            latest_sale.get(
                "patient_name"
            )
        )
        or
        clean_text(
            latest_sale.get(
                "customer_name"
            )
        )
        or
        "registered patient"
    )

    total_amount = float(
        latest_sale.get(
            "total_amount",
            0,
        )
        or 0
    )

    status = (
        clean_text(
            latest_sale.get(
                "order_status"
            )
        )
        or
        clean_text(
            latest_sale.get(
                "status"
            )
        )
        or
        "Recorded"
    )

    return make_alert(
        alert_type="sales",
        severity="info",
        title="Latest Dispensing",
        message=(
            f"{order_number} for {patient_name} "
            f"was recorded for GHS {total_amount:.2f}. "
            f"Status: {status}."
        ),
        created_at=(
            latest_sale.get(
                "created_at"
            )
            or
            latest_sale.get(
                "date"
            )
        ),
        order_id=clean_text(
            latest_sale.get(
                "order_id"
            )
        ),
    )


# =========================================================
# LATEST PURCHASE
# =========================================================

def build_latest_purchase_alert(
    purchases_data,
):
    purchases = (
        extract_google_purchases(
            purchases_data
        )
    )

    if not purchases:
        return None

    latest_purchase = purchases[0]

    purchase_number = (
        clean_text(
            latest_purchase.get(
                "purchase_number"
            )
        )
        or
        clean_text(
            latest_purchase.get(
                "purchase_id"
            )
        )
        or
        "Latest purchase"
    )

    supplier_name = (
        clean_text(
            latest_purchase.get(
                "supplier_name"
            )
        )
        or
        "supplier"
    )

    total_amount = float(
        latest_purchase.get(
            "total_amount",
            0,
        )
        or 0
    )

    status = (
        clean_text(
            latest_purchase.get(
                "status"
            )
        )
        or
        "Recorded"
    )

    return make_alert(
        alert_type="purchase",
        severity="info",
        title="Latest Purchase",
        message=(
            f"{purchase_number} from {supplier_name} "
            f"was recorded for GHS {total_amount:.2f}. "
            f"Status: {status}."
        ),
        created_at=(
            latest_purchase.get(
                "created_at"
            )
            or
            latest_purchase.get(
                "date"
            )
        ),
        purchase_id=clean_text(
            latest_purchase.get(
                "purchase_id"
            )
        ),
    )


# =========================================================
# APPOINTMENTS
# =========================================================

def build_appointment_alerts(
    db,
):
    alerts = []

    if Appointment is None:
        return alerts

    try:
        appointments = (
            db.query(
                Appointment
            )
            .all()
        )

    except Exception:
        return alerts

    today = date.today()

    for appointment in appointments:
        status = clean_text(
            getattr(
                appointment,
                "status",
                "",
            )
        ).lower()

        if status in {
            "completed",
            "cancelled",
            "rejected",
        }:
            continue

        appointment_date_value = getattr(
            appointment,
            "appointment_date",
            None,
        )

        appointment_date = (
            parse_date_value(
                appointment_date_value
            )
        )

        if not appointment_date:
            continue

        appointment_type = (
            clean_text(
                getattr(
                    appointment,
                    "appointment_type",
                    "",
                )
            )
            or
            "Pharmacy appointment"
        )

        appointment_time = clean_text(
            getattr(
                appointment,
                "appointment_time",
                "",
            )
        )

        appointment_id = getattr(
            appointment,
            "id",
            None,
        )

        if appointment_date < today:
            alerts.append(
                make_alert(
                    alert_type="appointment",
                    severity="critical",
                    title="Overdue Appointment",
                    message=(
                        f"{appointment_type} scheduled for "
                        f"{appointment_date.isoformat()} "
                        "has passed and requires follow-up."
                    ),
                    created_at=appointment_date_value,
                    appointment_id=appointment_id,
                    appointment_time=appointment_time,
                    appointment_status=status,
                )
            )

            continue

        if appointment_date == today:
            time_text = (
                f" at {appointment_time}"
                if appointment_time
                else ""
            )

            alerts.append(
                make_alert(
                    alert_type="appointment",
                    severity="warning",
                    title="Appointment Due Today",
                    message=(
                        f"{appointment_type} is scheduled "
                        f"for today{time_text}."
                    ),
                    created_at=appointment_date_value,
                    appointment_id=appointment_id,
                    appointment_time=appointment_time,
                    appointment_status=status,
                )
            )

    return alerts


# =========================================================
# LOAD GOOGLE SOURCES IN PARALLEL
# =========================================================

def load_google_alert_sources():
    results = {
        "dashboard": None,
        "sales": None,
        "purchases": None,
    }

    errors = []

    tasks = {
        "dashboard":
            require_google_dashboard_data,

        "sales":
            require_google_sales_data,

        "purchases":
            require_google_purchases_data,
    }

    with ThreadPoolExecutor(
        max_workers=3
    ) as executor:
        futures = {
            executor.submit(
                loader
            ): name

            for name, loader
            in tasks.items()
        }

        for future in as_completed(
            futures
        ):
            name = futures[
                future
            ]

            try:
                results[
                    name
                ] = future.result()

            except HTTPException as exc:
                errors.append(
                    f"{name}: "
                    +
                    clean_text(
                        exc.detail
                    )
                )

            except Exception as exc:
                errors.append(
                    f"{name}: "
                    +
                    str(exc)
                )

    return (
        results,
        errors,
    )


# =========================================================
# BUILD ALERT RESPONSE
# =========================================================

def build_alert_response(
    db,
):
    alerts = []

    errors = []

    google_sources, google_errors = (
        load_google_alert_sources()
    )

    errors.extend(
        google_errors
    )

    dashboard_data = (
        google_sources.get(
            "dashboard"
        )
    )

    sales_data = (
        google_sources.get(
            "sales"
        )
    )

    purchases_data = (
        google_sources.get(
            "purchases"
        )
    )

    # =====================================================
    # INVENTORY + REFILLS
    # =====================================================

    if isinstance(
        dashboard_data,
        dict,
    ):
        alerts.extend(
            build_inventory_alerts(
                dashboard_data
            )
        )

        alerts.extend(
            build_refill_alerts(
                dashboard_data
            )
        )

    # =====================================================
    # LATEST SALE
    # =====================================================

    if isinstance(
        sales_data,
        dict,
    ):
        latest_sale = (
            build_latest_sale_alert(
                sales_data
            )
        )

        if latest_sale:
            alerts.append(
                latest_sale
            )

    # =====================================================
    # LATEST PURCHASE
    # =====================================================

    if isinstance(
        purchases_data,
        dict,
    ):
        latest_purchase = (
            build_latest_purchase_alert(
                purchases_data
            )
        )

        if latest_purchase:
            alerts.append(
                latest_purchase
            )

    # =====================================================
    # LOCAL APPOINTMENTS
    # =====================================================

    alerts.extend(
        build_appointment_alerts(
            db
        )
    )

    # =====================================================
    # SORT
    # =====================================================

    alerts = sort_alerts(
        alerts
    )

    critical_count = sum(
        1
        for alert in alerts
        if clean_text(
            alert.get(
                "severity"
            )
        ).lower()
        ==
        "critical"
    )

    warning_count = sum(
        1
        for alert in alerts
        if clean_text(
            alert.get(
                "severity"
            )
        ).lower()
        ==
        "warning"
    )

    info_count = sum(
        1
        for alert in alerts
        if clean_text(
            alert.get(
                "severity"
            )
        ).lower()
        ==
        "info"
    )

    missed_expired_count = sum(
        1
        for alert in alerts
        if clean_text(
            alert.get(
                "refill_status"
            )
        ).lower()
        ==
        "missed / expired"
    )

    overdue_refill_count = sum(
        1
        for alert in alerts
        if (
            clean_text(
                alert.get(
                    "type"
                )
            ).lower()
            ==
            "refill"
            and
            clean_text(
                alert.get(
                    "refill_status"
                )
            ).lower()
            ==
            "overdue"
        )
    )

    due_today_refill_count = sum(
        1
        for alert in alerts
        if (
            clean_text(
                alert.get(
                    "type"
                )
            ).lower()
            ==
            "refill"
            and
            clean_text(
                alert.get(
                    "refill_status"
                )
            ).lower()
            ==
            "due today"
        )
    )

    return {
        "source":
            "google-sheets-and-local-appointments",

        "cache_seconds":
            ALERT_CACHE_TTL_SECONDS,

        "refill_rules": {
            "overdue_days":
                f"1-{REFILL_OVERDUE_MAX_DAYS}",

            "missed_expired_from_day":
                REFILL_OVERDUE_MAX_DAYS + 1,
        },

        "alerts":
            alerts,

        "count":
            len(
                alerts
            ),

        "critical_count":
            critical_count,

        "warning_count":
            warning_count,

        "info_count":
            info_count,

        "due_today_refill_count":
            due_today_refill_count,

        "overdue_refill_count":
            overdue_refill_count,

        "missed_expired_count":
            missed_expired_count,

        "errors": [
            error
            for error in errors
            if error
        ],
    }


# =========================================================
# ADMIN ALERTS GET
# =========================================================

@router.get("")
def get_admin_alerts(
    db: Session = Depends(
        get_db
    ),
    current_admin: User = Depends(
        get_current_admin
    ),
):
    cached = get_cached_alerts()

    if cached is not None:
        return cached

    with _ALERT_CACHE_LOCK:
        cached = get_cached_alerts()

        if cached is not None:
            return cached

        response = build_alert_response(
            db
        )

        return set_cached_alerts(
            response
        )


# =========================================================
# REFILL ACTION REQUEST MODELS
# =========================================================

class RefillReviewRequest(
    BaseModel
):
    refill_id: str = Field(
        ...,
        min_length=1,
    )

    note: str = Field(
        ...,
        min_length=1,
    )


class RefillRescheduleRequest(
    BaseModel
):
    refill_id: str = Field(
        ...,
        min_length=1,
    )

    new_refill_date: str = Field(
        ...,
        min_length=1,
    )

    note: str = Field(
        ...,
        min_length=1,
    )


class RefillPatientCancelRequest(
    BaseModel
):
    refill_id: str = Field(
        ...,
        min_length=1,
    )

    reason: str = Field(
        ...,
        min_length=1,
    )


class RefillClinicalDeclineRequest(
    BaseModel
):
    refill_id: str = Field(
        ...,
        min_length=1,
    )

    reason: str = Field(
        ...,
        min_length=1,
    )

    note: str = ""


# =========================================================
# ADMIN LABEL
# =========================================================

def current_admin_label(
    current_admin: User,
):
    """
    Choose a readable admin identity for the Google Sheet
    Reviewed_By field without trusting a value from the browser.
    """

    candidates = [
        getattr(
            current_admin,
            "full_name",
            None,
        ),

        getattr(
            current_admin,
            "name",
            None,
        ),

        getattr(
            current_admin,
            "username",
            None,
        ),

        getattr(
            current_admin,
            "email",
            None,
        ),
    ]

    for candidate in candidates:
        value = clean_text(
            candidate
        )

        if value:
            return value

    admin_id = getattr(
        current_admin,
        "id",
        None,
    )

    if admin_id is not None:
        return f"Admin #{admin_id}"

    return "Admin"


# =========================================================
# GOOGLE ACTION RESPONSE
# =========================================================

def validate_google_action_response(
    result,
    *,
    fallback_error,
):
    if not isinstance(
        result,
        dict,
    ):
        raise HTTPException(
            status_code=502,
            detail=(
                "Google Apps Script returned "
                "an invalid response."
            ),
        )

    if result.get(
        "ok"
    ) is False:
        raise HTTPException(
            status_code=400,
            detail=(
                clean_text(
                    result.get(
                        "error"
                    )
                )
                or
                fallback_error
            ),
        )

    return result


def run_refill_google_action(
    *,
    action,
    payload,
    fallback_error,
):
    """
    Send one authenticated server-to-server refill action
    to the Apps Script web app.

    post_google_action_data() already supplies the Apps Script
    sync key from backend configuration.
    """

    try:
        result = post_google_action_data(
    action,
    payload,
    fallback_error,
)

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=(
                clean_text(
                    str(
                        exc
                    )
                )
                or
                fallback_error
            ),
        ) from exc

    result = (
        validate_google_action_response(
            result,
            fallback_error=fallback_error,
        )
    )

    # Critical for alert counts.
    # The next GET must rebuild instead of returning stale data.
    invalidate_alert_cache()

    return result


# =========================================================
# REVIEW REFILL
# =========================================================

@router.post(
    "/refills/review"
)
def review_admin_refill(
    payload: RefillReviewRequest,
    current_admin: User = Depends(
        get_current_admin
    ),
):
    refill_id = clean_text(
        payload.refill_id
    )

    note = clean_text(
        payload.note
    )

    if not refill_id:
        raise HTTPException(
            status_code=400,
            detail="Refill ID is required.",
        )

    if not note:
        raise HTTPException(
            status_code=400,
            detail=(
                "A pharmacist review note "
                "is required."
            ),
        )

    result = run_refill_google_action(
        action="admin-refill-review",
        payload={
            "refill_id":
                refill_id,

            "note":
                note,

            "reviewed_by":
                current_admin_label(
                    current_admin
                ),
        },
        fallback_error=(
            "Unable to save refill review."
        ),
    )

    return {
        "ok":
            True,

        "message":
            clean_text(
                result.get(
                    "message"
                )
            )
            or
            "Refill review saved successfully.",

        "refill":
            result.get(
                "refill"
            )
            or
            result,
    }


# =========================================================
# RESCHEDULE REFILL
# =========================================================

@router.post(
    "/refills/reschedule"
)
def reschedule_admin_refill(
    payload: RefillRescheduleRequest,
    current_admin: User = Depends(
        get_current_admin
    ),
):
    refill_id = clean_text(
        payload.refill_id
    )

    new_refill_date = clean_text(
        payload.new_refill_date
    )

    note = clean_text(
        payload.note
    )

    if not refill_id:
        raise HTTPException(
            status_code=400,
            detail="Refill ID is required.",
        )

    parsed_date = parse_date_value(
        new_refill_date
    )

    if parsed_date is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "Please enter a valid "
                "new refill date."
            ),
        )

    if parsed_date < date.today():
        raise HTTPException(
            status_code=400,
            detail=(
                "The new refill date "
                "cannot be in the past."
            ),
        )

    if not note:
        raise HTTPException(
            status_code=400,
            detail=(
                "A reason or pharmacist note "
                "is required when rescheduling."
            ),
        )

    result = run_refill_google_action(
        action="admin-refill-reschedule",
        payload={
            "refill_id":
                refill_id,

            "new_refill_date":
                new_refill_date,

            "note":
                note,

            "reviewed_by":
                current_admin_label(
                    current_admin
                ),
        },
        fallback_error=(
            "Unable to reschedule refill."
        ),
    )

    return {
        "ok":
            True,

        "message":
            clean_text(
                result.get(
                    "message"
                )
            )
            or
            "Refill rescheduled successfully.",

        "refill":
            result.get(
                "refill"
            )
            or
            result,
    }


# =========================================================
# CANCELLED BY PATIENT
# =========================================================

@router.post(
    "/refills/patient-cancel"
)
def cancel_admin_refill_by_patient(
    payload: RefillPatientCancelRequest,
    current_admin: User = Depends(
        get_current_admin
    ),
):
    refill_id = clean_text(
        payload.refill_id
    )

    reason = clean_text(
        payload.reason
    )

    if not refill_id:
        raise HTTPException(
            status_code=400,
            detail="Refill ID is required.",
        )

    if not reason:
        raise HTTPException(
            status_code=400,
            detail=(
                "The patient's cancellation "
                "reason is required."
            ),
        )

    result = run_refill_google_action(
        action=(
            "admin-refill-patient-cancel"
        ),
        payload={
            "refill_id":
                refill_id,

            "reason":
                reason,

            "reviewed_by":
                current_admin_label(
                    current_admin
                ),
        },
        fallback_error=(
            "Unable to record "
            "patient cancellation."
        ),
    )

    return {
        "ok":
            True,

        "message":
            clean_text(
                result.get(
                    "message"
                )
            )
            or
            (
                "Patient cancellation "
                "recorded successfully."
            ),

        "refill":
            result.get(
                "refill"
            )
            or
            result,
    }


# =========================================================
# CLINICALLY DECLINED
# =========================================================

@router.post(
    "/refills/clinical-decline"
)
def clinically_decline_admin_refill(
    payload: RefillClinicalDeclineRequest,
    current_admin: User = Depends(
        get_current_admin
    ),
):
    refill_id = clean_text(
        payload.refill_id
    )

    reason = clean_text(
        payload.reason
    )

    note = clean_text(
        payload.note
    )

    if not refill_id:
        raise HTTPException(
            status_code=400,
            detail="Refill ID is required.",
        )

    if not reason:
        raise HTTPException(
            status_code=400,
            detail=(
                "A clinical decline reason "
                "is required."
            ),
        )

    result = run_refill_google_action(
        action=(
            "admin-refill-clinical-decline"
        ),
        payload={
            "refill_id":
                refill_id,

            "reason":
                reason,

            "note":
                note,

            "reviewed_by":
                current_admin_label(
                    current_admin
                ),
        },
        fallback_error=(
            "Unable to record "
            "clinical decline."
        ),
    )

    return {
        "ok":
            True,

        "message":
            clean_text(
                result.get(
                    "message"
                )
            )
            or
            (
                "Refill clinically declined "
                "successfully."
            ),

        "refill":
            result.get(
                "refill"
            )
            or
            result,
    }