from datetime import (
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

from sqlalchemy.orm import (
    Session,
)

from database import (
    SessionLocal,
)

from models import (
    User,
)

from security import (
    decode_access_token,
    hash_password,
    verify_password,
)

from user_session_models import (
    UserSession,
)


router = APIRouter(
    tags=[
        "Profile"
    ]
)


bearer_scheme = (
    HTTPBearer()
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
# ENSURE SESSION TABLE
# ============================================================

def ensure_session_table(
    db: Session,
):
    UserSession.__table__.create(
        bind=
            db.get_bind(),

        checkfirst=
            True,
    )


# ============================================================
# CURRENT USER
# ============================================================

def get_current_user(
    credentials:
        HTTPAuthorizationCredentials
        = Depends(
            bearer_scheme
        ),

    db:
        Session
        = Depends(
            get_db
        ),
):
    token = (
        credentials.credentials
    )

    try:
        payload = (
            decode_access_token(
                token
            )
        )

        user_id = int(
            payload[
                "sub"
            ]
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
            User.id
            == user_id
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
# CURRENT SESSION PAYLOAD
# ============================================================

def get_current_session_payload(
    credentials:
        HTTPAuthorizationCredentials
        = Depends(
            bearer_scheme
        ),
):
    try:
        return decode_access_token(
            credentials.credentials
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


# ============================================================
# REQUEST MODELS
# ============================================================

class UpdateProfileRequest(
    BaseModel
):
    full_name: str = Field(
        min_length=2,
        max_length=150,
    )


class ChangePasswordRequest(
    BaseModel
):
    current_password: str = Field(
        min_length=1,
        max_length=200,
    )

    new_password: str = Field(
        min_length=8,
        max_length=200,
    )

    confirm_password: str = Field(
        min_length=8,
        max_length=200,
    )


class VerifyPasswordRequest(
    BaseModel
):
    password: str = Field(
        min_length=1,
        max_length=200,
    )


class IdentifySessionRequest(
    BaseModel
):
    browser: str = Field(
        min_length=1,
        max_length=120,
    )

    device_type: str = Field(
        min_length=1,
        max_length=80,
    )

    platform: str = Field(
        min_length=1,
        max_length=120,
    )

    user_agent: str | None = Field(
        default=None,
        max_length=500,
    )


# ============================================================
# UPDATE PROFILE
# ============================================================

@router.patch(
    "/me"
)
def update_me(
    request:
        UpdateProfileRequest,

    current_user:
        User
        = Depends(
            get_current_user
        ),

    db:
        Session
        = Depends(
            get_db
        ),
):
    cleaned_name = (
        request.full_name
        .strip()
    )


    if len(cleaned_name) < 2:
        raise HTTPException(
            status_code=400,
            detail=(
                "Full name must contain "
                "at least 2 characters."
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


# ============================================================
# VERIFY PASSWORD
#
# IMPORTANT:
# This checks the existing authenticated admin session.
# It DOES NOT create another login token/session.
# ============================================================

@router.post(
    "/me/verify-password"
)
def verify_current_password(
    request:
        VerifyPasswordRequest,

    current_user:
        User
        = Depends(
            get_current_user
        ),
):
    role = (
        str(
            current_user.role
            or ""
        )
        .strip()
        .lower()
    )


    if role != "admin":
        raise HTTPException(
            status_code=403,
            detail=(
                "Administrator verification "
                "is required."
            ),
        )


    if not verify_password(
        request.password,
        current_user.password_hash,
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Incorrect administrator password."
            ),
        )


    return {
        "verified":
            True,

        "user_id":
            current_user.id,

        "role":
            current_user.role,

        "message":
            "Administrator password verified.",
    }


# ============================================================
# CHANGE PASSWORD
# ============================================================

@router.patch(
    "/me/password"
)
def change_password(
    request:
        ChangePasswordRequest,

    current_user:
        User
        = Depends(
            get_current_user
        ),

    db:
        Session
        = Depends(
            get_db
        ),
):
    if not verify_password(
        request.current_password,
        current_user.password_hash,
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Current password "
                "is incorrect."
            ),
        )


    if (
        request.new_password
        != request.confirm_password
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "New passwords "
                "do not match."
            ),
        )


    new_password = (
        request.new_password
    )


    if len(new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail=(
                "New password must "
                "contain at least "
                "8 characters."
            ),
        )


    if new_password.isspace():
        raise HTTPException(
            status_code=400,
            detail=(
                "New password cannot "
                "contain only spaces."
            ),
        )


    if verify_password(
        new_password,
        current_user.password_hash,
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "New password must "
                "be different from "
                "the current password."
            ),
        )


    current_user.password_hash = (
        hash_password(
            new_password
        )
    )


    db.commit()

    db.refresh(
        current_user
    )


    return {
        "message": (
            "Password changed successfully. "
            "Please sign in again using "
            "your new password."
        ),

        "user_id":
            current_user.id,

        "role":
            current_user.role,

        "requires_login":
            True,
    }


# ============================================================
# IDENTIFY CURRENT SESSION
# ============================================================

@router.patch(
    "/me/sessions/current"
)
def identify_current_session(
    request:
        IdentifySessionRequest,

    current_user:
        User
        = Depends(
            get_current_user
        ),

    payload:
        dict
        = Depends(
            get_current_session_payload
        ),

    db:
        Session
        = Depends(
            get_db
        ),
):
    ensure_session_table(
        db
    )


    session_id = (
        payload.get(
            "sid"
        )
    )


    if not session_id:
        raise HTTPException(
            status_code=401,
            detail=(
                "Current session could "
                "not be identified."
            ),
        )


    session = (
        db.query(
            UserSession
        )
        .filter(
            UserSession.session_id
            == session_id,

            UserSession.user_id
            == current_user.id,
        )
        .first()
    )


    if not session:
        raise HTTPException(
            status_code=404,
            detail=(
                "Current session "
                "was not found."
            ),
        )


    if (
        session.revoked_at
        is not None
    ):
        raise HTTPException(
            status_code=401,
            detail=(
                "This session has "
                "already been revoked."
            ),
        )


    session.browser = (
        request.browser
        .strip()
    )

    session.device_type = (
        request.device_type
        .strip()
    )

    session.platform = (
        request.platform
        .strip()
    )

    session.user_agent = (
        request.user_agent.strip()
        if request.user_agent
        else None
    )

    session.last_seen_at = (
        datetime.now(
            timezone.utc
        )
    )


    db.commit()

    db.refresh(
        session
    )


    return {
        "message":
            "Current session updated.",

        "session_id":
            session.session_id,

        "browser":
            session.browser,

        "device_type":
            session.device_type,

        "platform":
            session.platform,

        "created_at": (
            session.created_at
            .isoformat()
            if session.created_at
            else None
        ),

        "last_seen_at": (
            session.last_seen_at
            .isoformat()
            if session.last_seen_at
            else None
        ),

        "is_current":
            True,
    }


# ============================================================
# LIST ACTIVE SESSIONS
# ============================================================

@router.get(
    "/me/sessions"
)
def get_active_sessions(
    current_user:
        User
        = Depends(
            get_current_user
        ),

    payload:
        dict
        = Depends(
            get_current_session_payload
        ),

    db:
        Session
        = Depends(
            get_db
        ),
):
    ensure_session_table(
        db
    )


    current_session_id = (
        payload.get(
            "sid"
        )
    )


    sessions = (
        db.query(
            UserSession
        )
        .filter(
            UserSession.user_id
            == current_user.id,

            UserSession.revoked_at
            == None,
        )
        .order_by(
            UserSession.last_seen_at
            .desc(),

            UserSession.id
            .desc(),
        )
        .all()
    )


    return {
        "count":
            len(
                sessions
            ),

        "sessions": [
            {
                "session_id":
                    item.session_id,

                "browser": (
                    item.browser
                    or
                    "Unidentified Browser"
                ),

                "device_type": (
                    item.device_type
                    or
                    "Unknown Device"
                ),

                "platform": (
                    item.platform
                    or
                    "Unknown Platform"
                ),

                "created_at": (
                    item.created_at
                    .isoformat()
                    if item.created_at
                    else None
                ),

                "last_seen_at": (
                    item.last_seen_at
                    .isoformat()
                    if item.last_seen_at
                    else None
                ),

                "is_current": (
                    item.session_id
                    == current_session_id
                ),
            }

            for item
            in sessions
        ],
    }


# ============================================================
# REVOKE ONE SESSION
# ============================================================

@router.delete(
    "/me/sessions/{session_id}"
)
def revoke_session(
    session_id: str,

    current_user:
        User
        = Depends(
            get_current_user
        ),

    payload:
        dict
        = Depends(
            get_current_session_payload
        ),

    db:
        Session
        = Depends(
            get_db
        ),
):
    ensure_session_table(
        db
    )


    session = (
        db.query(
            UserSession
        )
        .filter(
            UserSession.session_id
            == session_id,

            UserSession.user_id
            == current_user.id,
        )
        .first()
    )


    if not session:
        raise HTTPException(
            status_code=404,
            detail=(
                "Session not found."
            ),
        )


    if (
        session.revoked_at
        is not None
    ):
        return {
            "message":
                "Session is already signed out.",

            "session_id":
                session.session_id,

            "is_current": (
                session.session_id
                == payload.get(
                    "sid"
                )
            ),
        }


    session.revoked_at = (
        datetime.now(
            timezone.utc
        )
    )


    db.commit()


    is_current = (
        session.session_id
        == payload.get(
            "sid"
        )
    )


    return {
        "message":
            "Session signed out successfully.",

        "session_id":
            session.session_id,

        "is_current":
            is_current,

        "requires_login":
            is_current,
    }


# ============================================================
# SIGN OUT OTHER SESSIONS
# ============================================================

@router.delete(
    "/me/sessions"
)
def revoke_other_sessions(
    current_user:
        User
        = Depends(
            get_current_user
        ),

    payload:
        dict
        = Depends(
            get_current_session_payload
        ),

    db:
        Session
        = Depends(
            get_db
        ),
):
    ensure_session_table(
        db
    )


    current_session_id = (
        payload.get(
            "sid"
        )
    )


    now = datetime.now(
        timezone.utc
    )


    sessions = (
        db.query(
            UserSession
        )
        .filter(
            UserSession.user_id
            == current_user.id,

            UserSession.revoked_at
            == None,

            UserSession.session_id
            != current_session_id,
        )
        .all()
    )


    revoked_count = 0


    for session in sessions:
        session.revoked_at = (
            now
        )

        revoked_count += 1


    db.commit()


    return {
        "message": (
            "Other sessions signed "
            "out successfully."
        ),

        "revoked":
            revoked_count,
    }