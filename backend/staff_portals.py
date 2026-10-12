"""
DR. EVANS PHARMACY
STAFF PORTALS — PHARMACIST & PHARMACY TECHNICIAN

Scope of this module:
  - Shared, centralized role constants.
  - Secure role-based authentication helpers for the Pharmacist
    and Pharmacy Technician portals.
  - Two lightweight identity endpoints used only to confirm who
    is signed in and to authorize the empty portal landing pages.

IMPORTANT:
  - No operational or clinical features are implemented here.
  - The doctors' requirements for the Pharmacist and Technician
    portals will be provided later, at which point additional
    endpoints can be added without changing this authentication
    foundation.
  - No existing database tables are created, dropped or renamed.
"""

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
from models import User
from security import decode_access_token


# ============================================================
# ROLE CONSTANTS
#
# Centralized so the backend and frontend never rely on
# scattered, case-sensitive string literals.
# ============================================================

ROLE_PATIENT = "patient"
ROLE_PHARMACIST = "pharmacist"
ROLE_TECHNICIAN = "technician"
ROLE_ADMIN = "admin"


# ============================================================
# ROUTER CONFIGURATION
# ============================================================

router = APIRouter(
    prefix="/staff",
    tags=["Staff Portals"],
)

security = HTTPBearer()


# ============================================================
# DATABASE SESSION
# ============================================================

def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ============================================================
# AUTHENTICATION HELPERS
#
# Each helper decodes the bearer token, loads the user, verifies
# the account is active, and enforces the required role. Invalid
# or missing tokens return 401; the wrong role returns 403.
# ============================================================

def _load_authenticated_user(
    credentials: HTTPAuthorizationCredentials,
    db: Session,
) -> User:
    try:
        payload = decode_access_token(
            credentials.credentials
        )

        user_id = int(payload["sub"])

    except (
        ValueError,
        KeyError,
        TypeError,
        AttributeError,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session.",
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


def get_current_pharmacist(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(get_db),
) -> User:
    """
    Require an active account whose role is 'pharmacist'.
    """
    user = _load_authenticated_user(credentials, db)

    if (
        str(user.role or "").strip().lower()
        != ROLE_PHARMACIST
    ):
        raise HTTPException(
            status_code=403,
            detail="Pharmacist access is required.",
        )

    return user


def get_current_technician(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(get_db),
) -> User:
    """
    Require an active account whose role is 'technician'.
    """
    user = _load_authenticated_user(credentials, db)

    if (
        str(user.role or "").strip().lower()
        != ROLE_TECHNICIAN
    ):
        raise HTTPException(
            status_code=403,
            detail="Pharmacy technician access is required.",
        )

    return user


# ============================================================
# IDENTITY SERIALIZATION
# ============================================================

def serialize_staff_identity(user: User, portal: str) -> dict:
    return {
        "portal": portal,
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": str(user.role or "").strip().lower(),
        "is_active": bool(user.is_active),
    }


# ============================================================
# PHARMACIST PORTAL IDENTITY
#
# Confirms the signed-in pharmacist and authorizes the empty
# landing page. No clinical or operational data is returned.
# ============================================================

@router.get("/pharmacist/me")
def pharmacist_portal_me(
    pharmacist: User = Depends(get_current_pharmacist),
):
    return serialize_staff_identity(
        pharmacist,
        "pharmacist",
    )


# ============================================================
# PHARMACY TECHNICIAN PORTAL IDENTITY
#
# Confirms the signed-in technician and authorizes the empty
# landing page. No operational data is returned.
# ============================================================

@router.get("/technician/me")
def technician_portal_me(
    technician: User = Depends(get_current_technician),
):
    return serialize_staff_identity(
        technician,
        "technician",
    )
