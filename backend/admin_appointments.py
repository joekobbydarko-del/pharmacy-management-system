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

from security import decode_access_token


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/admin/appointments",
    tags=["Admin Appointments"],
)


# ============================================================
# SECURITY
# ============================================================

security = HTTPBearer()


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
            detail="Invalid or expired authentication token.",
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
            detail="Authenticated user was not found.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="This account is inactive.",
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

class AppointmentRescheduleRequest(
    BaseModel
):
    appointment_date: str
    appointment_time: str


# ============================================================
# HELPERS
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


def get_appointment_or_404(
    db: Session,
    appointment_id: int,
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
            detail="Appointment not found.",
        )

    return appointment


def appointment_response(
    appointment: Appointment,
    patient: User | None = None,
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
# GET ALL APPOINTMENTS
# ============================================================

@router.get("")
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
        appointment_response(
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
    "/{appointment_id}/approve"
)
def approve_appointment(
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
            appointment_response(
                appointment,
                patient,
            ),
    }


# ============================================================
# REJECT APPOINTMENT
# ============================================================

@router.patch(
    "/{appointment_id}/reject"
)
def reject_appointment(
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
            appointment_response(
                appointment,
                patient,
            ),
    }


# ============================================================
# RESCHEDULE APPOINTMENT
# ============================================================

@router.patch(
    "/{appointment_id}/reschedule"
)
def reschedule_appointment(
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
            detail="Appointment date is required.",
        )

    if not appointment_time:
        raise HTTPException(
            status_code=400,
            detail="Appointment time is required.",
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
            appointment_response(
                appointment,
                patient,
            ),
    }


# ============================================================
# COMPLETE APPOINTMENT
# ============================================================

@router.patch(
    "/{appointment_id}/complete"
)
def complete_appointment(
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
            appointment_response(
                appointment,
                patient,
            ),
    }