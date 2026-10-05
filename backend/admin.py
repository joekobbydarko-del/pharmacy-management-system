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
from order_models import MedicineOrder
from prescription_models import Prescription
from refill_models import RefillRequest
from appointment_models import Appointment

from inventory_models import (
    Drug,
    InventoryItem,
)

from inventory_sync import (
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
        db.query(User)
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


# ============================================================
# HELPERS
# ============================================================

def normalize_status(
    value,
):
    return str(
        value or ""
    ).strip().lower()


def get_patient_or_404(
    patient_id: int,
    db: Session,
):
    patient = (
        db.query(User)
        .filter(
            User.id == patient_id,
            User.role == "patient",
        )
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail=(
                "Patient account "
                "was not found."
            ),
        )

    return patient


def build_patient_summary(
    patient: User,
    db: Session,
):
    total_orders = (
        db.query(
            MedicineOrder
        )
        .filter(
            MedicineOrder.user_id
            == patient.id
        )
        .count()
    )

    total_prescriptions = (
        db.query(
            Prescription
        )
        .filter(
            Prescription.user_id
            == patient.id
        )
        .count()
    )

    total_refills = (
        db.query(
            RefillRequest
        )
        .filter(
            RefillRequest.user_id
            == patient.id
        )
        .count()
    )

    total_appointments = (
        db.query(
            Appointment
        )
        .filter(
            Appointment.user_id
            == patient.id
        )
        .count()
    )

    return {
        "patient_id":
            patient.id,

        "full_name":
            patient.full_name,

        "email":
            patient.email,

        "role":
            patient.role,

        "is_active":
            patient.is_active,

        "activity": {
            "orders":
                total_orders,

            "prescriptions":
                total_prescriptions,

            "refills":
                total_refills,

            "appointments":
                total_appointments,
        },
    }


# ============================================================
# ADMIN DASHBOARD
# ============================================================

@router.get(
    "/dashboard"
)
def get_admin_dashboard(
    db: Session = Depends(
        get_db
    ),
    current_admin: User = Depends(
        get_current_admin
    ),
):
    total_patients = (
        db.query(User)
        .filter(
            User.role == "patient"
        )
        .count()
    )

    total_orders = (
        db.query(
            MedicineOrder
        )
        .count()
    )

    pending_orders = (
        db.query(
            MedicineOrder
        )
        .filter(
            MedicineOrder.status.in_(
                [
                    "pending",
                    "processing",
                    "requested",
                ]
            )
        )
        .count()
    )

    pending_refills = (
        db.query(
            RefillRequest
        )
        .filter(
            RefillRequest.status.in_(
                [
                    "pending",
                    "processing",
                    "requested",
                ]
            )
        )
        .count()
    )

    pending_appointments = (
        db.query(
            Appointment
        )
        .filter(
            Appointment.status.in_(
                [
                    "pending",
                    "requested",
                ]
            )
        )
        .count()
    )

    active_prescriptions = (
        db.query(
            Prescription
        )
        .filter(
            Prescription.status
            == "active"
        )
        .count()
    )

    total_inventory_items = (
        db.query(
            InventoryItem
        )
        .count()
    )

    low_stock_items = (
        db.query(
            InventoryItem
        )
        .filter(
            InventoryItem.stock_quantity
            <=
            InventoryItem.reorder_level
        )
        .count()
    )

    recent_rows = (
        db.query(
            MedicineOrder,
            User,
        )
        .join(
            User,
            User.id
            == MedicineOrder.user_id,
        )
        .order_by(
            MedicineOrder.id.desc()
        )
        .limit(5)
        .all()
    )

    recent_orders = []

    for (
        order,
        patient,
    ) in recent_rows:
        recent_orders.append(
            {
                "order_id":
                    order.id,

                "patient_id":
                    patient.id,

                "patient_name":
                    patient.full_name,

                "patient_email":
                    patient.email,

                "medicine_name":
                    order.medicine_name,

                "quantity":
                    order.quantity,

                "notes":
                    order.notes,

                "status":
                    normalize_status(
                        order.status
                    )
                    or "pending",
            }
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

        "metrics": {
            "total_patients":
                total_patients,

            "total_orders":
                total_orders,

            "pending_orders":
                pending_orders,

            "pending_refills":
                pending_refills,

            "pending_appointments":
                pending_appointments,

            "active_prescriptions":
                active_prescriptions,

            "inventory_items":
                total_inventory_items,

            "low_stock_items":
                low_stock_items,
        },

        "recent_orders":
            recent_orders,

        "availability": {
            "sales":
                False,

            "profit":
                False,

            "inventory":
                True,

            "suppliers":
                False,

            "purchases":
                False,
        },
    }


# ============================================================
# ADMIN PATIENTS
# ============================================================

@router.get(
    "/patients"
)
def get_admin_patients(
    db: Session = Depends(
        get_db
    ),
    current_admin: User = Depends(
        get_current_admin
    ),
):
    patients = (
        db.query(User)
        .filter(
            User.role == "patient"
        )
        .order_by(
            User.full_name.asc(),
            User.id.asc(),
        )
        .all()
    )

    return {
        "total":
            len(patients),

        "active":
            sum(
                1
                for patient
                in patients
                if patient.is_active
            ),

        "inactive":
            sum(
                1
                for patient
                in patients
                if not patient.is_active
            ),

        "patients": [
            {
                "patient_id":
                    patient.id,

                "full_name":
                    patient.full_name,

                "email":
                    patient.email,

                "role":
                    patient.role,

                "is_active":
                    patient.is_active,
            }

            for patient
            in patients
        ],
    }


# ============================================================
# ADMIN PATIENT DETAIL
# ============================================================

@router.get(
    "/patients/{patient_id}"
)
def get_admin_patient(
    patient_id: int,

    db: Session = Depends(
        get_db
    ),

    current_admin: User = Depends(
        get_current_admin
    ),
):
    patient = get_patient_or_404(
        patient_id,
        db,
    )

    return build_patient_summary(
        patient,
        db,
    )


# ============================================================
# ADMIN PATIENT STATUS
# ============================================================

@router.patch(
    "/patients/{patient_id}/status"
)
def update_admin_patient_status(
    patient_id: int,

    request:
        PatientStatusUpdate,

    db: Session = Depends(
        get_db
    ),

    current_admin: User = Depends(
        get_current_admin
    ),
):
    patient = get_patient_or_404(
        patient_id,
        db,
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
# ADMIN INVENTORY LIST
# ============================================================

@router.get(
    "/inventory"
)
def get_admin_inventory(
    db: Session = Depends(
        get_db
    ),

    current_admin: User = Depends(
        get_current_admin
    ),
):
    inventory_rows = (
        db.query(
            InventoryItem
        )
        .order_by(
            InventoryItem.drug_name.asc()
        )
        .all()
    )

    items = []

    low_stock = 0
    healthy = 0
    out_of_stock = 0

    total_units = 0

    for inventory_item in inventory_rows:
        drug = (
            db.query(
                Drug
            )
            .filter(
                Drug.drug_id
                == inventory_item.drug_id
            )
            .first()
        )

        stock_quantity = (
            inventory_item.stock_quantity
            or 0
        )

        reorder_level = (
            inventory_item.reorder_level
            or 0
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
                    inventory_item.inventory_id,

                "drug_id":
                    inventory_item.drug_id,

                "drug_name":
                    inventory_item.drug_name,

                "category": (
                    drug.category
                    if drug
                    else None
                ),

                "cost_price": (
                    float(
                        drug.cost_price
                    )
                    if (
                        drug
                        and
                        drug.cost_price
                        is not None
                    )
                    else 0
                ),

                "monthly_price": (
                    float(
                        drug.monthly_price
                    )
                    if (
                        drug
                        and
                        drug.monthly_price
                        is not None
                    )
                    else 0
                ),

                "one_time_price": (
                    float(
                        drug.one_time_price
                    )
                    if (
                        drug
                        and
                        drug.one_time_price
                        is not None
                    )
                    else 0
                ),

                "stock_quantity":
                    stock_quantity,

                "reorder_level":
                    reorder_level,

                "stock_status": (
                    inventory_item.stock_status
                    or calculated_status
                ),

                "calculated_status":
                    calculated_status,

                "last_updated": (
                    inventory_item
                    .last_updated
                    .isoformat()
                    if inventory_item.last_updated
                    else None
                ),
            }
        )

    return {
        "summary": {
            "total_items":
                len(items),

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