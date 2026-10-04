import os

from urllib.parse import quote

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from pydantic import (
    BaseModel,
    Field,
)

from sqlalchemy import func

from sqlalchemy.orm import Session

from database import SessionLocal

from models import User

from security import (
    create_password_reset_token,
    decode_password_reset_token,
    get_password_version,
    hash_password,
    verify_password,
)


router = APIRouter(
    tags=[
        "Password Reset"
    ]
)


FRONTEND_RESET_URL = os.getenv(
    "FRONTEND_RESET_URL",
    "http://localhost:5173/reset-password",
)


PASSWORD_RESET_DEBUG = (
    os.getenv(
        "PASSWORD_RESET_DEBUG",
        "true",
    ).lower()
    == "true"
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
# REQUEST MODELS
# ============================================================

class ForgotPasswordRequest(
    BaseModel
):
    email: str


class ResetPasswordRequest(
    BaseModel
):
    token: str

    new_password: str = Field(
        min_length=8,
        max_length=128,
    )


# ============================================================
# PASSWORD RULES
# ============================================================

def validate_new_password(
    password: str,
):
    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail=(
                "Password must be at "
                "least 8 characters long."
            ),
        )

    if not any(
        character.isalpha()
        for character
        in password
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Password must contain "
                "at least one letter."
            ),
        )

    if not any(
        character.isdigit()
        for character
        in password
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Password must contain "
                "at least one number."
            ),
        )


# ============================================================
# FORGOT PASSWORD
# ============================================================

@router.post(
    "/forgot-password"
)
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(
        get_db
    ),
):
    email = (
        request.email
        .strip()
        .lower()
    )

    if not email:
        raise HTTPException(
            status_code=400,
            detail=(
                "Email address is required."
            ),
        )


    user = (
        db.query(User)
        .filter(
            func.lower(
                User.email
            )
            == email
        )
        .first()
    )


    # Always use the same public
    # response whether an account
    # exists or not.
    response = {
        "message": (
            "If an account exists "
            "for that email address, "
            "password reset instructions "
            "have been prepared."
        )
    }


    if (
        not user
        or not user.is_active
    ):
        return response


    reset_token = (
        create_password_reset_token(
            user_id=user.id,
            hashed_password=(
                user.password_hash
            ),
        )
    )


    encoded_token = quote(
        reset_token,
        safe="",
    )


    reset_url = (
        f"{FRONTEND_RESET_URL}"
        f"?token={encoded_token}"
    )


    # ========================================================
    # DEVELOPMENT MODE
    #
    # This allows us to test the
    # password reset flow locally.
    #
    # Later this URL will be emailed
    # to the patient instead.
    # ========================================================

    if PASSWORD_RESET_DEBUG:
        response[
            "development_reset_url"
        ] = reset_url


        print(
            "\n"
            "===================================="
        )

        print(
            "PASSWORD RESET LINK"
        )

        print(
            reset_url
        )

        print(
            "===================================="
            "\n"
        )


    return response


# ============================================================
# RESET PASSWORD
# ============================================================

@router.post(
    "/reset-password"
)
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(
        get_db
    ),
):
    token = (
        request.token.strip()
    )

    new_password = (
        request.new_password
    )


    if not token:
        raise HTTPException(
            status_code=400,
            detail=(
                "Password reset token "
                "is required."
            ),
        )


    validate_new_password(
        new_password
    )


    try:
        payload = (
            decode_password_reset_token(
                token
            )
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
            status_code=400,
            detail=(
                "This password reset "
                "link is invalid or "
                "has expired."
            ),
        )


    user = (
        db.query(User)
        .filter(
            User.id
            == user_id
        )
        .first()
    )


    if not user:
        raise HTTPException(
            status_code=400,
            detail=(
                "This password reset "
                "link is invalid or "
                "has expired."
            ),
        )


    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail=(
                "This account is inactive."
            ),
        )


    token_password_version = (
        payload.get(
            "pwdv"
        )
    )

    current_password_version = (
        get_password_version(
            user.password_hash
        )
    )


    if (
        token_password_version
        != current_password_version
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "This password reset "
                "link has already been "
                "used or is no longer "
                "valid."
            ),
        )


    if verify_password(
        new_password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Your new password "
                "must be different from "
                "your current password."
            ),
        )


    user.password_hash = (
        hash_password(
            new_password
        )
    )


    db.commit()


    return {
        "message": (
            "Password reset successful. "
            "You can now sign in with "
            "your new password."
        )
    }