from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
)

from fastapi.middleware.cors import CORSMiddleware

from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)

from pydantic import BaseModel, Field

from sqlalchemy.orm import Session

from database import SessionLocal

from models import User

from order_models import MedicineOrder

from prescription_models import Prescription

from refill_models import RefillRequest

from appointment_models import Appointment

from pharmacist_message_models import PharmacistMessage

from support_request_models import SupportRequest

from notification_models import Notification

from lab_result_models import LabResult

from reminder_models import Reminder

from schemas import (
    LoginRequest,
    SignUpRequest,
)

from security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)

from password_reset import (
    router as password_reset_router,
)

from profile import (
    router as profile_router,
)

from admin import (
    router as admin_router,
)

from pos import (
    router as pos_router,
)

from sales import (
    router as sales_router,
)

from purchases import (
    router as purchases_router,
)

from suppliers import (
    router as suppliers_router,
)

from reports import (
    router as reports_router,
)

from alerts import (
    router as alerts_router,
)


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="Dr. Evans Pharmacy API",
    description="Backend API for Dr. Evans Pharmacy",
    version="1.0.0",
)


app.include_router(
    password_reset_router
)

app.include_router(
    profile_router
)

app.include_router(
    admin_router
)

app.include_router(
    pos_router
)

app.include_router(
    sales_router
)

app.include_router(
    purchases_router
)

app.include_router(
    suppliers_router
)

app.include_router(
    reports_router
)

app.include_router(
    alerts_router
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://192.168.8.142:5173",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


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
# AUTHENTICATION
# ============================================================

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        bearer_scheme
    ),
    db: Session = Depends(get_db),
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

    return user


# ============================================================
# ACCESS HELPER
# ============================================================

def verify_patient_access(
    requested_user_id: int,
    current_user: User,
):
    if current_user.role == "admin":
        return

    if (
        current_user.id
        != requested_user_id
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "You do not have permission "
                "to access this patient account."
            ),
        )


# ============================================================
# REQUEST MODELS
# ============================================================

class MedicineOrderRequest(
    BaseModel
):
    user_id: int

    medicine_name: str

    quantity: int = Field(
        gt=0
    )

    notes: str | None = None


class RefillRequestCreate(
    BaseModel
):
    user_id: int

    prescription_id: int

    notes: str | None = None


class AppointmentRequest(
    BaseModel
):
    user_id: int

    appointment_type: str

    appointment_date: str

    appointment_time: str

    note: str | None = None


class PharmacistMessageRequest(
    BaseModel
):
    user_id: int

    subject: str

    message: str


class SupportRequestCreate(
    BaseModel
):
    user_id: int

    subject: str

    message: str


class NotificationCreate(
    BaseModel
):
    user_id: int

    title: str

    message: str

    icon: str = "bell"


# ============================================================
# TABLE CREATION
# ============================================================

@app.on_event("startup")
def create_new_tables():
    db = SessionLocal()

    try:
        bind = db.get_bind()

        MedicineOrder.__table__.create(
            bind=bind,
            checkfirst=True,
        )

        Prescription.__table__.create(
            bind=bind,
            checkfirst=True,
        )

        RefillRequest.__table__.create(
            bind=bind,
            checkfirst=True,
        )

        Appointment.__table__.create(
            bind=bind,
            checkfirst=True,
        )

        PharmacistMessage.__table__.create(
            bind=bind,
            checkfirst=True,
        )

        SupportRequest.__table__.create(
            bind=bind,
            checkfirst=True,
        )

        Notification.__table__.create(
            bind=bind,
            checkfirst=True,
        )

        LabResult.__table__.create(
            bind=bind,
            checkfirst=True,
        )

        Reminder.__table__.create(
            bind=bind,
            checkfirst=True,
        )

    finally:
        db.close()


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message":
            "Dr. Evans Pharmacy API is running"
    }


# ============================================================
# SIGN UP
# ============================================================

@app.post("/signup")
def signup(
    user: SignUpRequest,
    db: Session = Depends(
        get_db
    ),
):
    existing_user = (
        db.query(User)
        .filter(
            User.email
            == user.email
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail=(
                "An account with this email "
                "already exists."
            ),
        )

    new_user = User(
        full_name=
            user.full_name,

        email=
            user.email,

        password_hash=
            hash_password(
                user.password
            ),

        role="patient",

        is_active=True,
    )

    db.add(
        new_user
    )

    db.commit()

    db.refresh(
        new_user
    )

    return {
        "message":
            "Account created successfully",

        "user_id":
            new_user.id,

        "full_name":
            new_user.full_name,

        "email":
            new_user.email,

        "role":
            new_user.role,
    }


# ============================================================
# LOGIN
# ============================================================

@app.post("/login")
def login(
    user: LoginRequest,
    db: Session = Depends(
        get_db
    ),
):
    db_user = (
        db.query(User)
        .filter(
            User.email
            == user.email
        )
        .first()
    )

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid email or password."
            ),
        )

    if not verify_password(
        user.password,
        db_user.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid email or password."
            ),
        )

    if not db_user.is_active:
        raise HTTPException(
            status_code=403,
            detail=(
                "This account is inactive."
            ),
        )

    access_token = (
        create_access_token(
            user_id=
                db_user.id,

            role=
                db_user.role,
        )
    )

    return {
        "message":
            "Login successful",

        "access_token":
            access_token,

        "token_type":
            "bearer",

        "user_id":
            db_user.id,

        "full_name":
            db_user.full_name,

        "email":
            db_user.email,

        "role":
            db_user.role,
    }


# ============================================================
# CURRENT USER
# ============================================================

@app.get("/me")
def get_me(
    current_user: User = Depends(
        get_current_user
    ),
):
    return {
        "user_id":
            current_user.id,

        "full_name":
            current_user.full_name,

        "email":
            current_user.email,

        "role":
            current_user.role,

        "is_active":
            current_user.is_active,
    }


# ============================================================
# MEDICINE ORDERS
# ============================================================

@app.post("/orders")
def create_order(
    order: MedicineOrderRequest,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    ),
):
    verify_patient_access(
        order.user_id,
        current_user,
    )

    medicine_name = (
        order.medicine_name
        .strip()
    )

    if not medicine_name:
        raise HTTPException(
            status_code=400,
            detail=(
                "Medicine name is required."
            ),
        )

    new_order = MedicineOrder(
        user_id=
            order.user_id,

        medicine_name=
            medicine_name,

        quantity=
            order.quantity,

        notes=(
            order.notes.strip()
            if order.notes
            else None
        ),

        status="pending",
    )

    db.add(
        new_order
    )

    db.commit()

    db.refresh(
        new_order
    )

    return {
        "message":
            "Medicine order submitted successfully",

        "order_id":
            new_order.id,

        "user_id":
            new_order.user_id,

        "medicine_name":
            new_order.medicine_name,

        "quantity":
            new_order.quantity,

        "notes":
            new_order.notes,

        "status":
            new_order.status,
    }


@app.get(
    "/orders/{user_id}"
)
def get_user_orders(
    user_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    ),
):
    verify_patient_access(
        user_id,
        current_user,
    )

    orders = (
        db.query(
            MedicineOrder
        )
        .filter(
            MedicineOrder.user_id
            == user_id
        )
        .order_by(
            MedicineOrder.id.desc()
        )
        .all()
    )

    return [
        {
            "order_id":
                order.id,

            "user_id":
                order.user_id,

            "medicine_name":
                order.medicine_name,

            "quantity":
                order.quantity,

            "notes":
                order.notes,

            "status":
                order.status,
        }

        for order in orders
    ]


# ============================================================
# PRESCRIPTIONS
# ============================================================

@app.get(
    "/prescriptions/{user_id}"
)
def get_user_prescriptions(
    user_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    ),
):
    verify_patient_access(
        user_id,
        current_user,
    )

    prescriptions = (
        db.query(
            Prescription
        )
        .filter(
            Prescription.user_id
            == user_id
        )
        .order_by(
            Prescription.id.desc()
        )
        .all()
    )

    return [
        {
            "prescription_id":
                prescription.id,

            "user_id":
                prescription.user_id,

            "medicine_name":
                prescription.medicine_name,

            "dosage":
                prescription.dosage,

            "frequency":
                prescription.frequency,

            "instructions":
                prescription.instructions,

            "status":
                prescription.status,
        }

        for prescription
        in prescriptions
    ]


# ============================================================
# REFILL REQUESTS
# ============================================================

@app.post(
    "/refill-requests"
)
def create_refill_request(
    request:
        RefillRequestCreate,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    ),
):
    verify_patient_access(
        request.user_id,
        current_user,
    )

    prescription = (
        db.query(
            Prescription
        )
        .filter(
            Prescription.id
            == request.prescription_id,

            Prescription.user_id
            == request.user_id,
        )
        .first()
    )

    if not prescription:
        raise HTTPException(
            status_code=404,
            detail=(
                "Prescription not found."
            ),
        )

    if (
        string_lower(
            prescription.status
        )
        != "active"
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "This prescription "
                "is not active."
            ),
        )

    existing_request = (
        db.query(
            RefillRequest
        )
        .filter(
            RefillRequest.user_id
            == request.user_id,

            RefillRequest.prescription_id
            == request.prescription_id,

            RefillRequest.status.in_(
                [
                    "pending",
                    "processing",
                    "requested",
                ]
            ),
        )
        .first()
    )

    if existing_request:
        raise HTTPException(
            status_code=400,
            detail=(
                "A refill request for this "
                "prescription is already "
                "awaiting pharmacy review."
            ),
        )

    new_request = RefillRequest(
        user_id=
            request.user_id,

        prescription_id=
            request.prescription_id,

        notes=(
            request.notes.strip()
            if request.notes
            else None
        ),

        status="pending",
    )

    db.add(
        new_request
    )

    db.commit()

    db.refresh(
        new_request
    )

    return {
        "message":
            "Refill request submitted successfully",

        "request_id":
            new_request.id,

        "user_id":
            new_request.user_id,

        "prescription_id":
            new_request.prescription_id,

        "notes":
            new_request.notes,

        "status":
            new_request.status,
    }


@app.get(
    "/refill-requests/{user_id}"
)
def get_user_refill_requests(
    user_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    ),
):
    verify_patient_access(
        user_id,
        current_user,
    )

    requests = (
        db.query(
            RefillRequest
        )
        .filter(
            RefillRequest.user_id
            == user_id
        )
        .order_by(
            RefillRequest.id.desc()
        )
        .all()
    )

    return [
        {
            "request_id":
                request.id,

            "user_id":
                request.user_id,

            "prescription_id":
                request.prescription_id,

            "notes":
                request.notes,

            "status":
                request.status,
        }

        for request
        in requests
    ]


# ============================================================
# APPOINTMENTS
# ============================================================

@app.post(
    "/appointments"
)
def create_appointment(
    appointment:
        AppointmentRequest,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    ),
):
    verify_patient_access(
        appointment.user_id,
        current_user,
    )

    appointment_type = (
        appointment
        .appointment_type
        .strip()
    )

    appointment_date = (
        appointment
        .appointment_date
        .strip()
    )

    appointment_time = (
        appointment
        .appointment_time
        .strip()
    )

    if not appointment_type:
        raise HTTPException(
            status_code=400,
            detail=(
                "Appointment type "
                "is required."
            ),
        )

    if not appointment_date:
        raise HTTPException(
            status_code=400,
            detail=(
                "Appointment date "
                "is required."
            ),
        )

    if not appointment_time:
        raise HTTPException(
            status_code=400,
            detail=(
                "Appointment time "
                "is required."
            ),
        )

    new_appointment = Appointment(
        user_id=
            appointment.user_id,

        appointment_type=
            appointment_type,

        appointment_date=
            appointment_date,

        appointment_time=
            appointment_time,

        note=(
            appointment.note.strip()
            if appointment.note
            else None
        ),

        status="pending",
    )

    db.add(
        new_appointment
    )

    db.commit()

    db.refresh(
        new_appointment
    )

    return {
        "message":
            "Appointment request submitted successfully",

        "appointment_id":
            new_appointment.id,

        "user_id":
            new_appointment.user_id,

        "appointment_type":
            new_appointment.appointment_type,

        "appointment_date":
            new_appointment.appointment_date,

        "appointment_time":
            new_appointment.appointment_time,

        "note":
            new_appointment.note,

        "status":
            new_appointment.status,
    }


@app.get(
    "/appointments/{user_id}"
)
def get_user_appointments(
    user_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    ),
):
    verify_patient_access(
        user_id,
        current_user,
    )

    appointments = (
        db.query(
            Appointment
        )
        .filter(
            Appointment.user_id
            == user_id
        )
        .order_by(
            Appointment.id.desc()
        )
        .all()
    )

    return [
        {
            "appointment_id":
                appointment.id,

            "user_id":
                appointment.user_id,

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

        for appointment
        in appointments
    ]


# ============================================================
# PHARMACIST MESSAGES
# ============================================================

@app.post(
    "/pharmacist-messages"
)
def create_pharmacist_message(
    request:
        PharmacistMessageRequest,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    ),
):
    verify_patient_access(
        request.user_id,
        current_user,
    )

    subject = (
        request.subject.strip()
    )

    message = (
        request.message.strip()
    )

    if not subject:
        raise HTTPException(
            status_code=400,
            detail=(
                "Message subject is required."
            ),
        )

    if not message:
        raise HTTPException(
            status_code=400,
            detail=(
                "Message is required."
            ),
        )

    if len(message) > 1000:
        raise HTTPException(
            status_code=400,
            detail=(
                "Message cannot exceed "
                "1000 characters."
            ),
        )

    new_message = (
        PharmacistMessage(
            user_id=
                request.user_id,

            subject=
                subject,

            message=
                message,

            status="pending",
        )
    )

    db.add(
        new_message
    )

    db.commit()

    db.refresh(
        new_message
    )

    return {
        "message_id":
            new_message.id,

        "user_id":
            new_message.user_id,

        "subject":
            new_message.subject,

        "message":
            new_message.message,

        "status":
            new_message.status,

        "pharmacist_response":
            new_message.pharmacist_response,

        "created_at": (
            new_message
            .created_at
            .isoformat()

            if new_message.created_at

            else None
        ),
    }


@app.get(
    "/pharmacist-messages/{user_id}"
)
def get_user_pharmacist_messages(
    user_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    ),
):
    verify_patient_access(
        user_id,
        current_user,
    )

    messages = (
        db.query(
            PharmacistMessage
        )
        .filter(
            PharmacistMessage.user_id
            == user_id
        )
        .order_by(
            PharmacistMessage.id.desc()
        )
        .all()
    )

    return [
        {
            "message_id":
                item.id,

            "user_id":
                item.user_id,

            "subject":
                item.subject,

            "message":
                item.message,

            "status":
                item.status,

            "pharmacist_response":
                item.pharmacist_response,

            "created_at": (
                item.created_at.isoformat()

                if item.created_at

                else None
            ),
        }

        for item in messages
    ]


# ============================================================
# TECHNICAL SUPPORT
# ============================================================

@app.post(
    "/support-requests"
)
def create_support_request(
    request:
        SupportRequestCreate,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    ),
):
    verify_patient_access(
        request.user_id,
        current_user,
    )

    subject = (
        request.subject.strip()
    )

    message = (
        request.message.strip()
    )

    if not subject:
        raise HTTPException(
            status_code=400,
            detail=(
                "Support request subject "
                "is required."
            ),
        )

    if not message:
        raise HTTPException(
            status_code=400,
            detail=(
                "Support request message "
                "is required."
            ),
        )

    if len(subject) > 120:
        raise HTTPException(
            status_code=400,
            detail=(
                "Support request subject "
                "cannot exceed 120 characters."
            ),
        )

    if len(message) > 1000:
        raise HTTPException(
            status_code=400,
            detail=(
                "Support request message "
                "cannot exceed 1000 characters."
            ),
        )

    new_request = (
        SupportRequest(
            user_id=
                request.user_id,

            subject=
                subject,

            message=
                message,

            status="pending",
        )
    )

    db.add(
        new_request
    )

    db.commit()

    db.refresh(
        new_request
    )

    return {
        "request_id":
            new_request.id,

        "user_id":
            new_request.user_id,

        "subject":
            new_request.subject,

        "message":
            new_request.message,

        "status":
            new_request.status,

        "support_response":
            new_request.support_response,

        "created_at": (
            new_request
            .created_at
            .isoformat()

            if new_request.created_at

            else None
        ),
    }


@app.get(
    "/support-requests/{user_id}"
)
def get_user_support_requests(
    user_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    ),
):
    verify_patient_access(
        user_id,
        current_user,
    )

    requests = (
        db.query(
            SupportRequest
        )
        .filter(
            SupportRequest.user_id
            == user_id
        )
        .order_by(
            SupportRequest.id.desc()
        )
        .all()
    )

    return [
        {
            "request_id":
                item.id,

            "user_id":
                item.user_id,

            "subject":
                item.subject,

            "message":
                item.message,

            "status":
                item.status,

            "support_response":
                item.support_response,

            "created_at": (
                item.created_at.isoformat()

                if item.created_at

                else None
            ),
        }

        for item
        in requests
    ]


# ============================================================
# NOTIFICATIONS
# ============================================================

@app.post(
    "/notifications"
)
def create_notification(
    request:
        NotificationCreate,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    ),
):
    verify_patient_access(
        request.user_id,
        current_user,
    )

    title = (
        request.title.strip()
    )

    message = (
        request.message.strip()
    )

    if not title:
        raise HTTPException(
            status_code=400,
            detail=(
                "Notification title "
                "is required."
            ),
        )

    if not message:
        raise HTTPException(
            status_code=400,
            detail=(
                "Notification message "
                "is required."
            ),
        )

    new_notification = Notification(
        user_id=
            request.user_id,

        title=
            title,

        message=
            message,

        icon=(
            request.icon.strip()

            if request.icon

            else "bell"
        ),

        is_read=False,
    )

    db.add(
        new_notification
    )

    db.commit()

    db.refresh(
        new_notification
    )

    return {
        "id":
            new_notification.id,

        "user_id":
            new_notification.user_id,

        "title":
            new_notification.title,

        "message":
            new_notification.message,

        "icon":
            new_notification.icon,

        "read":
            new_notification.is_read,

        "created_at": (
            new_notification
            .created_at
            .isoformat()

            if new_notification.created_at

            else None
        ),
    }


@app.get(
    "/notifications/{user_id}"
)
def get_user_notifications(
    user_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    ),
):
    verify_patient_access(
        user_id,
        current_user,
    )

    notifications = (
        db.query(
            Notification
        )
        .filter(
            Notification.user_id
            == user_id
        )
        .order_by(
            Notification.id.desc()
        )
        .limit(30)
        .all()
    )

    return [
        {
            "id":
                notification.id,

            "user_id":
                notification.user_id,

            "title":
                notification.title,

            "message":
                notification.message,

            "icon":
                notification.icon,

            "read":
                notification.is_read,

            "created_at": (
                notification
                .created_at
                .isoformat()

                if notification.created_at

                else None
            ),
        }

        for notification
        in notifications
    ]


@app.patch(
    "/notifications/{notification_id}/read"
)
def mark_notification_read(
    notification_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    ),
):
    notification = (
        db.query(
            Notification
        )
        .filter(
            Notification.id
            == notification_id
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail=(
                "Notification not found."
            ),
        )

    verify_patient_access(
        notification.user_id,
        current_user,
    )

    notification.is_read = True

    db.commit()

    db.refresh(
        notification
    )

    return {
        "id":
            notification.id,

        "read":
            notification.is_read,
    }


@app.patch(
    "/notifications/{user_id}/read-all"
)
def mark_all_notifications_read(
    user_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    ),
):
    verify_patient_access(
        user_id,
        current_user,
    )

    updated = (
        db.query(
            Notification
        )
        .filter(
            Notification.user_id
            == user_id,

            Notification.is_read
            == False,
        )
        .update(
            {
                Notification.is_read:
                    True
            },

            synchronize_session=False,
        )
    )

    db.commit()

    return {
        "message":
            "All notifications marked as read.",

        "updated":
            updated,
    }


@app.delete(
    "/notifications/{user_id}"
)
def clear_user_notifications(
    user_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    ),
):
    verify_patient_access(
        user_id,
        current_user,
    )

    deleted = (
        db.query(
            Notification
        )
        .filter(
            Notification.user_id
            == user_id
        )
        .delete(
            synchronize_session=False
        )
    )

    db.commit()

    return {
        "message":
            "Notifications cleared successfully.",

        "deleted":
            deleted,
    }


# ============================================================
# LAB RESULTS
# ============================================================

@app.get(
    "/lab-results/{user_id}"
)
def get_user_lab_results(
    user_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    ),
):
    verify_patient_access(
        user_id,
        current_user,
    )

    results = (
        db.query(
            LabResult
        )
        .filter(
            LabResult.user_id
            == user_id
        )
        .order_by(
            LabResult.result_date.desc(),
            LabResult.id.desc(),
        )
        .all()
    )

    return [
        {
            "lab_result_id":
                result.id,

            "user_id":
                result.user_id,

            "test_name":
                result.test_name,

            "result_value":
                result.result_value,

            "unit":
                result.unit,

            "reference_range":
                result.reference_range,

            "status":
                result.status,

            "notes":
                result.notes,

            "result_date": (
                result
                .result_date
                .isoformat()

                if result.result_date

                else None
            ),
        }

        for result
        in results
    ]


# ============================================================
# REMINDERS
# ============================================================

@app.get(
    "/reminders/{user_id}"
)
def get_user_reminders(
    user_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    ),
):
    verify_patient_access(
        user_id,
        current_user,
    )

    reminders = (
        db.query(
            Reminder
        )
        .filter(
            Reminder.user_id
            == user_id
        )
        .order_by(
            Reminder.reminder_date.asc(),
            Reminder.id.asc(),
        )
        .all()
    )

    return [
        {
            "reminder_id":
                reminder.id,

            "user_id":
                reminder.user_id,

            "title":
                reminder.title,

            "message":
                reminder.message,

            "reminder_type":
                reminder.reminder_type,

            "reminder_date": (
                reminder
                .reminder_date
                .isoformat()

                if reminder.reminder_date

                else None
            ),

            "completed":
                reminder.is_completed,

            "created_at": (
                reminder
                .created_at
                .isoformat()

                if reminder.created_at

                else None
            ),
        }

        for reminder
        in reminders
    ]


@app.patch(
    "/reminders/{reminder_id}/complete"
)
def mark_reminder_complete(
    reminder_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    ),
):
    reminder = (
        db.query(
            Reminder
        )
        .filter(
            Reminder.id
            == reminder_id
        )
        .first()
    )

    if not reminder:
        raise HTTPException(
            status_code=404,
            detail=(
                "Reminder not found."
            ),
        )

    verify_patient_access(
        reminder.user_id,
        current_user,
    )

    reminder.is_completed = True

    db.commit()

    db.refresh(
        reminder
    )

    return {
        "reminder_id":
            reminder.id,

        "user_id":
            reminder.user_id,

        "title":
            reminder.title,

        "message":
            reminder.message,

        "reminder_type":
            reminder.reminder_type,

        "reminder_date": (
            reminder
            .reminder_date
            .isoformat()

            if reminder.reminder_date

            else None
        ),

        "completed":
            reminder.is_completed,

        "created_at": (
            reminder
            .created_at
            .isoformat()

            if reminder.created_at

            else None
        ),
    }


# ============================================================
# SMALL STRING HELPER
# ============================================================

def string_lower(
    value
):
    return str(
        value or ""
    ).lower()