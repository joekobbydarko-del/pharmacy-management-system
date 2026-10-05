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
from supplier_models import Supplier


router = APIRouter(
    prefix="/admin/suppliers",
    tags=["Admin Suppliers"],
)

security = HTTPBearer()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    payload = decode_access_token(
        credentials.credentials
    )

    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token.",
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid token payload.",
        )

    user = (
        db.query(User)
        .filter(
            User.id == int(user_id)
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
            detail="Administrator access required.",
        )

    return user


class SupplierCreateRequest(BaseModel):
    supplier_name: str
    contact_person: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    notes: str | None = None


class SupplierStatusUpdate(BaseModel):
    is_active: bool


@router.get("")
def get_suppliers(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    suppliers = (
        db.query(Supplier)
        .order_by(
            Supplier.supplier_name.asc()
        )
        .all()
    )

    return {
        "suppliers": [
            {
                "id": supplier.id,
                "supplier_code": supplier.supplier_code,
                "supplier_name": supplier.supplier_name,
                "contact_person": supplier.contact_person,
                "phone": supplier.phone,
                "email": supplier.email,
                "address": supplier.address,
                "notes": supplier.notes,
                "is_active": supplier.is_active,
                "created_at": (
                    supplier.created_at.isoformat()
                    if supplier.created_at
                    else None
                ),
            }
            for supplier in suppliers
        ],
        "count": len(suppliers),
    }


@router.post("")
def create_supplier(
    request: SupplierCreateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    supplier_name = request.supplier_name.strip()

    if not supplier_name:
        raise HTTPException(
            status_code=400,
            detail="Supplier name is required.",
        )

    existing = (
        db.query(Supplier)
        .filter(
            Supplier.supplier_name
            == supplier_name
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Supplier already exists.",
        )

    supplier = Supplier(
        supplier_code="TEMP",
        supplier_name=supplier_name,
        contact_person=(
            request.contact_person.strip()
            if request.contact_person
            else None
        ),
        phone=(
            request.phone.strip()
            if request.phone
            else None
        ),
        email=(
            request.email.strip()
            if request.email
            else None
        ),
        address=(
            request.address.strip()
            if request.address
            else None
        ),
        notes=(
            request.notes.strip()
            if request.notes
            else None
        ),
        is_active=True,
    )

    db.add(supplier)
    db.flush()

    supplier.supplier_code = (
        f"SUP-{supplier.id:04d}"
    )

    db.commit()
    db.refresh(supplier)

    return {
        "message":
            "Supplier created successfully.",

        "supplier": {
            "id": supplier.id,
            "supplier_code": supplier.supplier_code,
            "supplier_name": supplier.supplier_name,
            "contact_person": supplier.contact_person,
            "phone": supplier.phone,
            "email": supplier.email,
            "address": supplier.address,
            "notes": supplier.notes,
            "is_active": supplier.is_active,
        },
    }


@router.patch("/{supplier_id}/status")
def update_supplier_status(
    supplier_id: int,
    request: SupplierStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    supplier = (
        db.query(Supplier)
        .filter(
            Supplier.id == supplier_id
        )
        .first()
    )

    if not supplier:
        raise HTTPException(
            status_code=404,
            detail="Supplier not found.",
        )

    supplier.is_active = (
        request.is_active
    )

    db.commit()
    db.refresh(supplier)

    return {
        "message":
            "Supplier status updated successfully.",

        "supplier": {
            "id": supplier.id,
            "supplier_code": supplier.supplier_code,
            "supplier_name": supplier.supplier_name,
            "is_active": supplier.is_active,
        },
    }