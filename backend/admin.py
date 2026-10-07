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
from appointment_models import Appointment

from inventory_sync import (
    get_google_admin_dashboard_data,
    sync_inventory_from_google,
)

from security import (
    decode_access_token,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


# ============================================================
# AUTH
# ============================================================

bearer_scheme = HTTPBearer()


# ============================================================
# DATABASE
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
        bearer_scheme
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

        user_id = int(
            payload["sub"]
        )

    except (
        ValueError,
        KeyError,
        TypeError,
    ):
        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid or expired "
                "authentication token."
            ),
        )

    user = (
        db.query(
            User
        )
        .filter(
            User.id == user_id
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail=(
                "Authenticated user "
                "was not found."
            ),
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail=(
                "This account is inactive."
            ),
        )

    if (
        str(
            user.role or ""
        )
        .strip()
        .lower()
        != "admin"
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "Administrator access "
                "is required."
            ),
        )

    return user


# ============================================================
# REQUEST MODELS
# ============================================================

class PatientStatusUpdate(
    BaseModel
):
    is_active: bool


class AppointmentRescheduleRequest(
    BaseModel
):
    appointment_date: str
    appointment_time: str


# ============================================================
# GENERAL HELPERS
# ============================================================

def clean_text(
    value,
):
    return str(
        value or ""
    ).strip()


def normalized_status(
    value,
):
    return clean_text(
        value
    ).lower()


def safe_float(
    value,
):
    try:
        if (
            value is None
            or value == ""
        ):
            return 0.0

        if isinstance(
            value,
            str,
        ):
            value = (
                value
                .replace(
                    ",",
                    "",
                )
                .replace(
                    "GHS",
                    "",
                )
                .replace(
                    "GH₵",
                    "",
                )
                .strip()
            )

        return float(
            value
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


# ============================================================
# GOOGLE DASHBOARD
# ============================================================

def load_google_dashboard():
    try:
        dashboard = (
            get_google_admin_dashboard_data()
        )

    except RuntimeError as error:
        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to load live pharmacy data "
                "from Google Sheets: "
                + str(error)
            ),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Google pharmacy data loading failed: "
                + str(error)
            ),
        )

    if not isinstance(
        dashboard,
        dict,
    ):
        raise HTTPException(
            status_code=502,
            detail=(
                "Google Sheets returned an invalid "
                "dashboard response."
            ),
        )

    return dashboard


# ============================================================
# LIVE INVENTORY BUILDER
# ============================================================

def build_live_inventory_response(
    dashboard,
):
    raw_drugs = (
        dashboard.get(
            "drugs"
        )
        or []
    )

    raw_inventory = (
        dashboard.get(
            "inventory"
        )
        or []
    )

    if not isinstance(
        raw_drugs,
        list,
    ):
        raw_drugs = []

    if not isinstance(
        raw_inventory,
        list,
    ):
        raw_inventory = []

    drugs_by_id = {}

    for drug in raw_drugs:
        if not isinstance(
            drug,
            dict,
        ):
            continue

        drug_id = clean_text(
            drug.get(
                "Drug_ID"
            )
            or
            drug.get(
                "drug_id"
            )
        )

        if not drug_id:
            continue

        drugs_by_id[
            drug_id
        ] = drug

    items = []

    total_units = 0
    healthy = 0
    low_stock = 0
    out_of_stock = 0

    for inventory_item in raw_inventory:
        if not isinstance(
            inventory_item,
            dict,
        ):
            continue

        inventory_id = clean_text(
            inventory_item.get(
                "Inventory_ID"
            )
            or
            inventory_item.get(
                "inventory_id"
            )
        )

        drug_id = clean_text(
            inventory_item.get(
                "Drug_ID"
            )
            or
            inventory_item.get(
                "drug_id"
            )
        )

        if not drug_id:
            continue

        drug = (
            drugs_by_id.get(
                drug_id
            )
            or {}
        )

        drug_name = clean_text(
            inventory_item.get(
                "Drug_Name"
            )
            or
            inventory_item.get(
                "drug_name"
            )
            or
            drug.get(
                "Drug_Name"
            )
            or
            drug_id
        )

        category = clean_text(
            drug.get(
                "Category"
            )
            or
            drug.get(
                "category"
            )
        )

        cost_price = safe_float(
            drug.get(
                "Cost_Price"
            )
            if "Cost_Price" in drug
            else drug.get(
                "cost_price"
            )
        )

        monthly_price = safe_float(
            drug.get(
                "Monthly_Price"
            )
            if "Monthly_Price" in drug
            else drug.get(
                "monthly_price"
            )
        )

        one_time_price = safe_float(
            drug.get(
                "One_Time_Price"
            )
            if "One_Time_Price" in drug
            else drug.get(
                "one_time_price"
            )
        )

        stock_quantity = safe_int(
            inventory_item.get(
                "Stock_Quantity"
            )
            if "Stock_Quantity"
            in inventory_item
            else inventory_item.get(
                "stock_quantity"
            )
        )

        reorder_level = safe_int(
            inventory_item.get(
                "Reorder_Level"
            )
            if "Reorder_Level"
            in inventory_item
            else inventory_item.get(
                "reorder_level"
            )
        )

        source_status = clean_text(
            inventory_item.get(
                "Stock_Status"
            )
            or
            inventory_item.get(
                "stock_status"
            )
        )

        last_updated = (
            inventory_item.get(
                "Last_Updated"
            )
            if "Last_Updated"
            in inventory_item
            else inventory_item.get(
                "last_updated"
            )
        )

        total_units += (
            stock_quantity
        )

        if stock_quantity <= 0:
            calculated_status = (
                "Out of Stock"
            )

            out_of_stock += 1

        elif (
            stock_quantity
            <= reorder_level
        ):
            calculated_status = (
                "Low Stock"
            )

            low_stock += 1

        else:
            calculated_status = (
                "Healthy"
            )

            healthy += 1

        items.append(
            {
                "inventory_id":
                    inventory_id,

                "drug_id":
                    drug_id,

                "drug_name":
                    drug_name,

                "category":
                    category,

                "cost_price":
                    cost_price,

                "monthly_price":
                    monthly_price,

                "one_time_price":
                    one_time_price,

                "stock_quantity":
                    stock_quantity,

                "reorder_level":
                    reorder_level,

                "stock_status":
                    (
                        source_status
                        or
                        calculated_status
                    ),

                "calculated_status":
                    calculated_status,

                "last_updated":
                    last_updated,
            }
        )

    items.sort(
        key=lambda item:
            str(
                item.get(
                    "drug_name"
                )
                or ""
            ).lower()
    )

    return {
        "source":
            dashboard.get(
                "source",
                "google-sheets",
            ),

        "generated_at":
            dashboard.get(
                "generated_at"
            ),

        "summary": {
            "total_items":
                len(
                    items
                ),

            "total_units":
                total_units,

            "healthy":
                healthy,

            "low_stock":
                low_stock,

            "out_of_stock":
                out_of_stock,
        },

        "inventory":
            items,
    }


# ============================================================
# PATIENT DATA HELPERS
# ============================================================

def patient_row_to_response(
    patient,
):
    return {
        "patient_id":
            clean_text(
                patient.get(
                    "Patient_ID"
                )
            ),

        "full_name":
            clean_text(
                patient.get(
                    "Full_Name"
                )
            ),

        "phone":
            clean_text(
                patient.get(
                    "Phone"
                )
            ),

        "location":
            clean_text(
                patient.get(
                    "Location"
                )
            ),

        "condition":
            clean_text(
                patient.get(
                    "Condition"
                )
            ),

        "customer_type":
            clean_text(
                patient.get(
                    "Customer_Type"
                )
            ),

        "preferred_contact":
            clean_text(
                patient.get(
                    "Preferred_Contact"
                )
            ),

        "email":
            clean_text(
                patient.get(
                    "Patient_Email"
                )
            ),

        "patient_email":
            clean_text(
                patient.get(
                    "Patient_Email"
                )
            ),

        "doctor_email":
            clean_text(
                patient.get(
                    "Doctor_Email"
                )
            ),
    }


def build_patient_detail(
    dashboard,
    patient_id,
):
    patients = (
        dashboard.get(
            "patients"
        )
        or []
    )

    orders = (
        dashboard.get(
            "orders"
        )
        or []
    )

    order_items = (
        dashboard.get(
            "order_items"
        )
        or []
    )

    refills = (
        dashboard.get(
            "refills"
        )
        or []
    )

    clean_patient_id = clean_text(
        patient_id
    )

    patient = None

    for row in patients:
        if not isinstance(
            row,
            dict,
        ):
            continue

        if (
            clean_text(
                row.get(
                    "Patient_ID"
                )
            )
            ==
            clean_patient_id
        ):
            patient = row
            break

    if patient is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "Patient "
                + clean_patient_id
                + " was not found."
            ),
        )

    patient_orders = []
    order_ids = set()

    for order in orders:
        if not isinstance(
            order,
            dict,
        ):
            continue

        if (
            clean_text(
                order.get(
                    "Patient_ID"
                )
            )
            !=
            clean_patient_id
        ):
            continue

        patient_orders.append(
            order
        )

        order_id = clean_text(
            order.get(
                "Order_ID"
            )
        )

        if order_id:
            order_ids.add(
                order_id
            )

    total_order_value = 0.0
    total_profit = 0.0
    units = 0

    for item in order_items:
        if not isinstance(
            item,
            dict,
        ):
            continue

        order_id = clean_text(
            item.get(
                "Order_ID"
            )
        )

        if (
            order_id
            not in order_ids
        ):
            continue

        total_order_value += safe_float(
            item.get(
                "Total_Amount"
            )
        )

        total_profit += safe_float(
            item.get(
                "Profit"
            )
        )

        units += safe_int(
            item.get(
                "Quantity"
            )
        )

    completed_orders = 0
    pending_orders = 0
    paid_orders = 0

    for order in patient_orders:
        order_status = normalized_status(
            order.get(
                "Order_Status"
            )
        )

        payment_status = normalized_status(
            order.get(
                "Payment_Status"
            )
        )

        if (
            order_status
            in {
                "completed",
                "complete",
            }
        ):
            completed_orders += 1

        elif (
            order_status
            not in {
                "cancelled",
                "canceled",
            }
        ):
            pending_orders += 1

        if payment_status == "paid":
            paid_orders += 1

    patient_refills = []

    confirmed_refills = 0
    due_soon = 0
    due_today = 0
    overdue = 0

    for refill in refills:
        if not isinstance(
            refill,
            dict,
        ):
            continue

        if (
            clean_text(
                refill.get(
                    "Patient_ID"
                )
            )
            !=
            clean_patient_id
        ):
            continue

        patient_refills.append(
            refill
        )

        reminder_status = normalized_status(
            refill.get(
                "Reminder_Status"
            )
        )

        confirmation_status = normalized_status(
            refill.get(
                "Confirmation_Status"
            )
        )

        patient_response = normalized_status(
            refill.get(
                "Patient_Response"
            )
        )

        if reminder_status == "due soon":
            due_soon += 1

        elif reminder_status == "due today":
            due_today += 1

        elif reminder_status == "overdue":
            overdue += 1

        if (
            confirmation_status
            == "confirmed"
            or
            patient_response
            == "confirmed"
        ):
            confirmed_refills += 1

    result = (
        patient_row_to_response(
            patient
        )
    )

    result["activity"] = {
        "orders":
            len(
                patient_orders
            ),

        "completed_orders":
            completed_orders,

        "pending_orders":
            pending_orders,

        "paid_orders":
            paid_orders,

        "refills":
            len(
                patient_refills
            ),

        "confirmed_refills":
            confirmed_refills,

        "due_soon":
            due_soon,

        "due_today":
            due_today,

        "overdue":
            overdue,

        "units":
            units,

        "total_order_value":
            total_order_value,

        "total_spent":
            total_order_value,

        "profit":
            total_profit,
    }

    return result


# ============================================================
# APPOINTMENT HELPERS
# ============================================================

def get_appointment_or_404(
    db,
    appointment_id,
):
    appointment = (
        db.query(
            Appointment
        )
        .filter(
            Appointment.id
            == appointment_id
        )
        .first()
    )

    if not appointment:
        raise HTTPException(
            status_code=404,
            detail=(
                "Appointment not found."
            ),
        )

    return appointment


def appointment_to_response(
    appointment,
    patient=None,
):
    return {
        "id":
            appointment.id,

        "appointment_id":
            appointment.id,

        "user_id":
            appointment.user_id,

        "patient_id":
            appointment.user_id,

        "patient_name":
            (
                patient.full_name
                if patient
                else ""
            ),

        "patient_email":
            (
                patient.email
                if patient
                else ""
            ),

        "appointment_type":
            appointment.appointment_type,

        "appointment_date":
            appointment.appointment_date,

        "appointment_time":
            appointment.appointment_time,

        "note":
            appointment.note,

        "status":
            appointment.status,
    }


# ============================================================
# ADMIN DASHBOARD
# ============================================================

@router.get(
    "/dashboard"
)
def get_admin_dashboard(
    current_admin: User = Depends(
        get_current_admin
    ),
):
    dashboard = (
        load_google_dashboard()
    )

    metrics = (
        dashboard.get(
            "metrics"
        )
        or {}
    )

    return {
        "administrator": {
            "user_id":
                current_admin.id,

            "full_name":
                current_admin.full_name,

            "email":
                current_admin.email,

            "role":
                current_admin.role,
        },

        "source":
            dashboard.get(
                "source",
                "google-sheets",
            ),

        "generated_at":
            dashboard.get(
                "generated_at"
            ),

        "metrics":
            metrics,

        "recent_orders":
            dashboard.get(
                "recent_orders"
            )
            or [],

        "top_medicines":
            dashboard.get(
                "top_medicines"
            )
            or [],

        "sales_trend":
            dashboard.get(
                "sales_trend"
            )
            or [],

        "refill_summary":
            dashboard.get(
                "refill_summary"
            )
            or {},

        "payment_summary":
            dashboard.get(
                "payment_summary"
            )
            or {},

        "inventory_summary":
            dashboard.get(
                "inventory_summary"
            )
            or {},

        "low_stock_items":
            dashboard.get(
                "low_stock_items"
            )
            or [],

        "invoice_summary":
            dashboard.get(
                "invoice_summary"
            )
            or {},

        "recent_activity":
            dashboard.get(
                "recent_activity"
            )
            or [],

        "availability":
            dashboard.get(
                "availability"
            )
            or {},
    }


# ============================================================
# ADMIN APPOINTMENTS
# ============================================================

@router.get(
    "/appointments"
)
def get_admin_appointments(
    current_admin: User = Depends(
        get_current_admin
    ),
    db: Session = Depends(
        get_db
    ),
):
    rows = (
        db.query(
            Appointment,
            User,
        )
        .join(
            User,
            User.id
            == Appointment.user_id,
        )
        .order_by(
            Appointment.id.desc()
        )
        .all()
    )

    appointments = [
        appointment_to_response(
            appointment,
            patient,
        )
        for (
            appointment,
            patient,
        )
        in rows
    ]

    pending_count = 0
    approved_count = 0
    rejected_count = 0
    completed_count = 0

    for appointment in appointments:
        status = normalized_status(
            appointment.get(
                "status"
            )
        )

        if status == "pending":
            pending_count += 1

        elif status == "approved":
            approved_count += 1

        elif status == "rejected":
            rejected_count += 1

        elif status == "completed":
            completed_count += 1

    return {
        "appointments":
            appointments,

        "count":
            len(
                appointments
            ),

        "pending_count":
            pending_count,

        "approved_count":
            approved_count,

        "rejected_count":
            rejected_count,

        "completed_count":
            completed_count,
    }


# ============================================================
# APPROVE APPOINTMENT
# ============================================================

@router.patch(
    "/appointments/{appointment_id}/approve"
)
def approve_admin_appointment(
    appointment_id: int,
    current_admin: User = Depends(
        get_current_admin
    ),
    db: Session = Depends(
        get_db
    ),
):
    appointment = (
        get_appointment_or_404(
            db,
            appointment_id,
        )
    )

    status = normalized_status(
        appointment.status
    )

    if status == "completed":
        raise HTTPException(
            status_code=400,
            detail=(
                "Completed appointments "
                "cannot be approved again."
            ),
        )

    appointment.status = (
        "approved"
    )

    db.commit()

    db.refresh(
        appointment
    )

    patient = (
        db.query(
            User
        )
        .filter(
            User.id
            == appointment.user_id
        )
        .first()
    )

    return {
        "message":
            "Appointment approved successfully.",

        "appointment":
            appointment_to_response(
                appointment,
                patient,
            ),
    }


# ============================================================
# REJECT APPOINTMENT
# ============================================================

@router.patch(
    "/appointments/{appointment_id}/reject"
)
def reject_admin_appointment(
    appointment_id: int,
    current_admin: User = Depends(
        get_current_admin
    ),
    db: Session = Depends(
        get_db
    ),
):
    appointment = (
        get_appointment_or_404(
            db,
            appointment_id,
        )
    )

    status = normalized_status(
        appointment.status
    )

    if status == "completed":
        raise HTTPException(
            status_code=400,
            detail=(
                "Completed appointments "
                "cannot be rejected."
            ),
        )

    appointment.status = (
        "rejected"
    )

    db.commit()

    db.refresh(
        appointment
    )

    patient = (
        db.query(
            User
        )
        .filter(
            User.id
            == appointment.user_id
        )
        .first()
    )

    return {
        "message":
            "Appointment rejected successfully.",

        "appointment":
            appointment_to_response(
                appointment,
                patient,
            ),
    }


# ============================================================
# RESCHEDULE APPOINTMENT
# ============================================================

@router.patch(
    "/appointments/{appointment_id}/reschedule"
)
def reschedule_admin_appointment(
    appointment_id: int,
    request: AppointmentRescheduleRequest,
    current_admin: User = Depends(
        get_current_admin
    ),
    db: Session = Depends(
        get_db
    ),
):
    appointment = (
        get_appointment_or_404(
            db,
            appointment_id,
        )
    )

    appointment_date = clean_text(
        request.appointment_date
    )

    appointment_time = clean_text(
        request.appointment_time
    )

    if not appointment_date:
        raise HTTPException(
            status_code=400,
            detail=(
                "Appointment date is required."
            ),
        )

    if not appointment_time:
        raise HTTPException(
            status_code=400,
            detail=(
                "Appointment time is required."
            ),
        )

    status = normalized_status(
        appointment.status
    )

    if status in {
        "completed",
        "rejected",
    }:
        raise HTTPException(
            status_code=400,
            detail=(
                "This appointment cannot "
                "be rescheduled."
            ),
        )

    appointment.appointment_date = (
        appointment_date
    )

    appointment.appointment_time = (
        appointment_time
    )

    appointment.status = (
        "approved"
    )

    db.commit()

    db.refresh(
        appointment
    )

    patient = (
        db.query(
            User
        )
        .filter(
            User.id
            == appointment.user_id
        )
        .first()
    )

    return {
        "message":
            "Appointment rescheduled successfully.",

        "appointment":
            appointment_to_response(
                appointment,
                patient,
            ),
    }


# ============================================================
# COMPLETE APPOINTMENT
# ============================================================

@router.patch(
    "/appointments/{appointment_id}/complete"
)
def complete_admin_appointment(
    appointment_id: int,
    current_admin: User = Depends(
        get_current_admin
    ),
    db: Session = Depends(
        get_db
    ),
):
    appointment = (
        get_appointment_or_404(
            db,
            appointment_id,
        )
    )

    status = normalized_status(
        appointment.status
    )

    if status != "approved":
        raise HTTPException(
            status_code=400,
            detail=(
                "Only approved appointments "
                "can be marked as completed."
            ),
        )

    appointment.status = (
        "completed"
    )

    db.commit()

    db.refresh(
        appointment
    )

    patient = (
        db.query(
            User
        )
        .filter(
            User.id
            == appointment.user_id
        )
        .first()
    )

    return {
        "message":
            "Appointment completed successfully.",

        "appointment":
            appointment_to_response(
                appointment,
                patient,
            ),
    }


# ============================================================
# ADMIN PATIENTS
# LIVE GOOGLE SHEETS DIRECTORY
# ============================================================

@router.get(
    "/patients"
)
def get_admin_patients(
    current_admin: User = Depends(
        get_current_admin
    ),
):
    dashboard = (
        load_google_dashboard()
    )

    raw_patients = (
        dashboard.get(
            "patients"
        )
        or []
    )

    if not isinstance(
        raw_patients,
        list,
    ):
        raw_patients = []

    patients = []

    monthly = 0
    one_time = 0

    for row in raw_patients:
        if not isinstance(
            row,
            dict,
        ):
            continue

        patient = (
            patient_row_to_response(
                row
            )
        )

        if not patient[
            "patient_id"
        ]:
            continue

        customer_type = (
            patient[
                "customer_type"
            ]
            .strip()
            .lower()
        )

        if customer_type == "monthly":
            monthly += 1

        elif (
            customer_type
            in {
                "one-time",
                "one time",
            }
        ):
            one_time += 1

        patients.append(
            patient
        )

    patients.sort(
        key=lambda item:
            (
                item.get(
                    "full_name"
                )
                or
                item.get(
                    "patient_id"
                )
                or
                ""
            ).lower()
    )

    return {
        "source":
            dashboard.get(
                "source",
                "google-sheets",
            ),

        "generated_at":
            dashboard.get(
                "generated_at"
            ),

        "total":
            len(
                patients
            ),

        "monthly":
            monthly,

        "one_time":
            one_time,

        "patients":
            patients,
    }


# ============================================================
# ADMIN PATIENT DETAIL
# LIVE GOOGLE SHEETS
# ============================================================

@router.get(
    "/patients/{patient_id}"
)
def get_admin_patient(
    patient_id: str,
    current_admin: User = Depends(
        get_current_admin
    ),
):
    dashboard = (
        load_google_dashboard()
    )

    return build_patient_detail(
        dashboard,
        patient_id,
    )


# ============================================================
# LOCAL LOGIN ACCOUNT STATUS
# PRESERVED FOR OLDER ACCOUNT MANAGEMENT
# ============================================================

@router.patch(
    "/patients/{patient_id}/status"
)
def update_admin_patient_status(
    patient_id: str,
    request: PatientStatusUpdate,
    db: Session = Depends(
        get_db
    ),
    current_admin: User = Depends(
        get_current_admin
    ),
):
    try:
        numeric_patient_id = int(
            patient_id
        )

    except (
        TypeError,
        ValueError,
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Google Sheet patient records do not "
                "have an account activation status."
            ),
        )

    patient = (
        db.query(
            User
        )
        .filter(
            User.id
            ==
            numeric_patient_id,

            User.role
            ==
            "patient",
        )
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail=(
                "Patient login account was not found."
            ),
        )

    patient.is_active = (
        request.is_active
    )

    db.commit()

    db.refresh(
        patient
    )

    return {
        "message": (
            "Patient account activated."
            if patient.is_active
            else
            "Patient account deactivated."
        ),

        "patient_id":
            patient.id,

        "is_active":
            patient.is_active,
    }


# ============================================================
# ADMIN INVENTORY SYNC
# LOCAL SQL MIRROR
# ============================================================

@router.post(
    "/inventory/sync"
)
def sync_admin_inventory(
    db: Session = Depends(
        get_db
    ),
    current_admin: User = Depends(
        get_current_admin
    ),
):
    try:
        result = (
            sync_inventory_from_google(
                db
            )
        )

        return {
            "message":
                "Inventory synchronized successfully.",

            **result,
        }

    except RuntimeError as error:
        raise HTTPException(
            status_code=502,
            detail=str(
                error
            ),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Inventory sync failed: "
                + str(error)
            ),
        )


# ============================================================
# ADMIN INVENTORY
# LIVE GOOGLE SHEETS
# ============================================================

@router.get(
    "/inventory"
)
def get_admin_inventory(
    current_admin: User = Depends(
        get_current_admin
    ),
):
    dashboard = (
        load_google_dashboard()
    )

    return build_live_inventory_response(
        dashboard
    )