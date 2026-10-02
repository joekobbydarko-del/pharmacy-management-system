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
from schemas import LoginRequest, SignUpRequest
from security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


app = FastAPI(
    title="Dr. Evans Pharmacy API",
    description="Backend API for Dr. Evans Pharmacy",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ================================
# DATABASE
# ================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ================================
# AUTHENTICATION
# ================================

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        bearer_scheme
    ),
    db: Session = Depends(get_db),
):
    token = credentials.credentials

    try:
        payload = decode_access_token(token)
        user_id = int(payload["sub"])

    except (ValueError, KeyError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token.",
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
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

    return user


# ================================
# REQUEST MODELS
# ================================

class MedicineOrderRequest(BaseModel):
    user_id: int
    medicine_name: str
    quantity: int = Field(gt=0)
    notes: str | None = None


class RefillRequestCreate(BaseModel):
    user_id: int
    prescription_id: int
    notes: str | None = None


# ================================
# DATABASE TABLE CREATION
# ================================

@app.on_event("startup")
def create_new_tables():
    db = SessionLocal()

    try:
        bind = db.get_bind()

        Prescription.__table__.create(
            bind=bind,
            checkfirst=True,
        )

        RefillRequest.__table__.create(
            bind=bind,
            checkfirst=True,
        )

    finally:
        db.close()


# ================================
# ROOT
# ================================

@app.get("/")
def root():
    return {
        "message": "Dr. Evans Pharmacy API is running"
    }


# ================================
# SIGN UP
# ================================

@app.post("/signup")
def signup(
    user: SignUpRequest,
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists.",
        )

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password_hash=hash_password(user.password),
        role="patient",
        is_active=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "Account created successfully",
        "user_id": new_user.id,
        "full_name": new_user.full_name,
        "email": new_user.email,
        "role": new_user.role,
    }


# ================================
# LOGIN
# ================================

@app.post("/login")
def login(
    user: LoginRequest,
    db: Session = Depends(get_db),
):
    db_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    if not verify_password(
        user.password,
        db_user.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    if not db_user.is_active:
        raise HTTPException(
            status_code=403,
            detail="This account is inactive.",
        )

    access_token = create_access_token(
        user_id=db_user.id,
        role=db_user.role,
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": db_user.id,
        "full_name": db_user.full_name,
        "email": db_user.email,
        "role": db_user.role,
    }


# ================================
# CURRENT USER
# ================================

@app.get("/me")
def get_me(
    current_user: User = Depends(get_current_user),
):
    return {
        "user_id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active,
    }


# ================================
# MEDICINE ORDERS
# ================================

@app.post("/orders")
def create_order(
    order: MedicineOrderRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == order.user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Patient account not found.",
        )

    new_order = MedicineOrder(
        user_id=order.user_id,
        medicine_name=order.medicine_name,
        quantity=order.quantity,
        notes=order.notes,
        status="pending",
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    return {
        "message": "Medicine order submitted successfully",
        "order_id": new_order.id,
        "user_id": new_order.user_id,
        "medicine_name": new_order.medicine_name,
        "quantity": new_order.quantity,
        "notes": new_order.notes,
        "status": new_order.status,
    }


@app.get("/orders/{user_id}")
def get_user_orders(
    user_id: int,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Patient account not found.",
        )

    orders = (
        db.query(MedicineOrder)
        .filter(MedicineOrder.user_id == user_id)
        .order_by(MedicineOrder.id.desc())
        .all()
    )

    return [
        {
            "order_id": order.id,
            "user_id": order.user_id,
            "medicine_name": order.medicine_name,
            "quantity": order.quantity,
            "notes": order.notes,
            "status": order.status,
        }
        for order in orders
    ]


# ================================
# PRESCRIPTIONS
# ================================

@app.get("/prescriptions/{user_id}")
def get_user_prescriptions(
    user_id: int,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Patient account not found.",
        )

    prescriptions = (
        db.query(Prescription)
        .filter(Prescription.user_id == user_id)
        .order_by(Prescription.id.desc())
        .all()
    )

    return [
        {
            "prescription_id": prescription.id,
            "user_id": prescription.user_id,
            "medicine_name": prescription.medicine_name,
            "dosage": prescription.dosage,
            "frequency": prescription.frequency,
            "instructions": prescription.instructions,
            "status": prescription.status,
        }
        for prescription in prescriptions
    ]


# ================================
# REFILL REQUESTS
# ================================

@app.post("/refill-requests")
def create_refill_request(
    request: RefillRequestCreate,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == request.user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Patient account not found.",
        )

    prescription = (
        db.query(Prescription)
        .filter(
            Prescription.id == request.prescription_id,
            Prescription.user_id == request.user_id,
        )
        .first()
    )

    if not prescription:
        raise HTTPException(
            status_code=404,
            detail="Prescription not found.",
        )

    if prescription.status.lower() != "active":
        raise HTTPException(
            status_code=400,
            detail="This prescription is not active.",
        )

    new_request = RefillRequest(
        user_id=request.user_id,
        prescription_id=request.prescription_id,
        notes=request.notes,
        status="pending",
    )

    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return {
        "message": "Refill request submitted successfully",
        "request_id": new_request.id,
        "user_id": new_request.user_id,
        "prescription_id": new_request.prescription_id,
        "notes": new_request.notes,
        "status": new_request.status,
    }


@app.get("/refill-requests/{user_id}")
def get_user_refill_requests(
    user_id: int,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Patient account not found.",
        )

    requests = (
        db.query(RefillRequest)
        .filter(RefillRequest.user_id == user_id)
        .order_by(RefillRequest.id.desc())
        .all()
    )

    return [
        {
            "request_id": request.id,
            "user_id": request.user_id,
            "prescription_id": request.prescription_id,
            "notes": request.notes,
            "status": request.status,
        }
        for request in requests
    ]