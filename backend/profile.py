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

from security import (
    decode_access_token,
)


router = APIRouter(
    tags=["Patient Profile"]
)


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
# AUTHENTICATED USER
# ============================================================


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
# REQUEST MODEL
# ============================================================


class UpdateProfileRequest(BaseModel):
    full_name: str = Field(
        min_length=2,
        max_length=150,
    )


# ============================================================
# UPDATE CURRENT PATIENT
# ============================================================


@router.patch("/me")
def update_me(
    request: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    cleaned_name = (
        request.full_name.strip()
    )


    if len(cleaned_name) < 2:
        raise HTTPException(
            status_code=400,
            detail=(
                "Full name must contain "
                "at least 2 characters."
            ),
        )


    if len(cleaned_name) > 150:
        raise HTTPException(
            status_code=400,
            detail=(
                "Full name cannot exceed "
                "150 characters."
            ),
        )


    current_user.full_name = (
        cleaned_name
    )


    db.commit()

    db.refresh(
        current_user
    )


    return {
        "message":
            "Profile updated successfully.",

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