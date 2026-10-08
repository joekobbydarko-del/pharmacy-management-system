import hashlib
import os
import uuid

from datetime import (
    datetime,
    timedelta,
    timezone,
)

import jwt

from jwt.exceptions import (
    InvalidTokenError,
)

from pwdlib import PasswordHash


password_hash = (
    PasswordHash.recommended()
)


JWT_SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY",
    "development-only-change-this-secret-key",
)

JWT_ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60

PASSWORD_RESET_EXPIRE_MINUTES = 15


# ============================================================
# PASSWORD HASHING
# ============================================================

def hash_password(
    password: str,
) -> str:
    return password_hash.hash(
        password
    )


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    return password_hash.verify(
        plain_password,
        hashed_password,
    )


# ============================================================
# SESSION DATABASE HELPERS
# ============================================================

def ensure_session_table():
    from database import (
        SessionLocal,
    )

    from user_session_models import (
        UserSession,
    )

    db = SessionLocal()

    try:
        bind = db.get_bind()

        UserSession.__table__.create(
            bind=bind,
            checkfirst=True,
        )

    finally:
        db.close()


def create_login_session(
    user_id: int,
) -> str:
    from database import (
        SessionLocal,
    )

    from user_session_models import (
        UserSession,
    )

    ensure_session_table()

    session_id = (
        uuid.uuid4().hex
    )

    now = datetime.now(
        timezone.utc
    )

    db = SessionLocal()

    try:
        new_session = UserSession(
            session_id=
                session_id,

            user_id=
                user_id,

            browser=
                "Unidentified Browser",

            device_type=
                "Unknown Device",

            platform=
                "Unknown Platform",

            user_agent=
                None,

            created_at=
                now,

            last_seen_at=
                now,

            revoked_at=
                None,
        )

        db.add(
            new_session
        )

        db.commit()

        return session_id

    except Exception:
        db.rollback()

        raise

    finally:
        db.close()


def get_legacy_session_id(
    token: str,
) -> str:
    digest = hashlib.sha256(
        token.encode(
            "utf-8"
        )
    ).hexdigest()[:40]

    return (
        f"legacy_{digest}"
    )


def get_or_create_legacy_session(
    token: str,
    user_id: int,
) -> str:
    from database import (
        SessionLocal,
    )

    from user_session_models import (
        UserSession,
    )

    ensure_session_table()

    session_id = (
        get_legacy_session_id(
            token
        )
    )

    db = SessionLocal()

    try:
        existing = (
            db.query(
                UserSession
            )
            .filter(
                UserSession.session_id
                == session_id
            )
            .first()
        )

        if existing:
            return session_id

        now = datetime.now(
            timezone.utc
        )

        legacy_session = (
            UserSession(
                session_id=
                    session_id,

                user_id=
                    user_id,

                browser=
                    "Current Browser",

                device_type=
                    "Current Device",

                platform=
                    "Legacy Login Session",

                user_agent=
                    None,

                created_at=
                    now,

                last_seen_at=
                    now,

                revoked_at=
                    None,
            )
        )

        db.add(
            legacy_session
        )

        db.commit()

        return session_id

    except Exception:
        db.rollback()

        raise

    finally:
        db.close()


def verify_session(
    session_id: str,
    user_id: int,
):
    from database import (
        SessionLocal,
    )

    from user_session_models import (
        UserSession,
    )

    ensure_session_table()

    db = SessionLocal()

    try:
        session = (
            db.query(
                UserSession
            )
            .filter(
                UserSession.session_id
                == session_id,

                UserSession.user_id
                == user_id,
            )
            .first()
        )

        if not session:
            raise ValueError(
                "Authentication session "
                "was not found."
            )

        if (
            session.revoked_at
            is not None
        ):
            raise ValueError(
                "This authentication "
                "session has been revoked."
            )

        now = datetime.now(
            timezone.utc
        )

        last_seen = (
            session.last_seen_at
        )

        should_update = True

        if last_seen:
            if (
                last_seen.tzinfo
                is None
            ):
                last_seen = (
                    last_seen.replace(
                        tzinfo=
                            timezone.utc
                    )
                )

            should_update = (
                now -
                last_seen
            ) >= timedelta(
                seconds=45
            )

        if should_update:
            session.last_seen_at = (
                now
            )

            db.commit()

    finally:
        db.close()


# ============================================================
# NORMAL ACCESS TOKEN
# ============================================================

def create_access_token(
    user_id: int,
    role: str,
    expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES,
) -> str:
    now = datetime.now(
        timezone.utc
    )

    expire = (
        now
        + timedelta(
            minutes=
                expires_minutes
        )
    )

    session_id = (
        create_login_session(
            user_id=
                user_id
        )
    )

    payload = {
        "sub":
            str(
                user_id
            ),

        "role":
            role,

        "purpose":
            "access",

        "sid":
            session_id,

        "iat":
            now,

        "exp":
            expire,
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=
            JWT_ALGORITHM,
    )


def decode_access_token(
    token: str,
) -> dict:
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[
                JWT_ALGORITHM
            ],
        )

        if not payload.get(
            "sub"
        ):
            raise ValueError(
                "Missing user ID "
                "in token"
            )

        purpose = (
            payload.get(
                "purpose"
            )
        )

        if (
            purpose
            and purpose
            != "access"
        ):
            raise ValueError(
                "Invalid authentication "
                "token"
            )

        user_id = int(
            payload[
                "sub"
            ]
        )

        session_id = (
            payload.get(
                "sid"
            )
        )

        # ----------------------------------------------------
        # Existing tokens issued before sessions were added
        # are converted into one stable legacy session.
        # ----------------------------------------------------

        if not session_id:
            session_id = (
                get_or_create_legacy_session(
                    token=
                        token,

                    user_id=
                        user_id,
                )
            )

            payload[
                "sid"
            ] = session_id

        verify_session(
            session_id=
                session_id,

            user_id=
                user_id,
        )

        return payload

    except InvalidTokenError as exc:
        raise ValueError(
            "Invalid or expired "
            "authentication token"
        ) from exc


# ============================================================
# PASSWORD VERSION
# ============================================================

def get_password_version(
    hashed_password: str,
) -> str:
    """
    Creates a small fingerprint of the
    current password hash.

    If the password changes, previously
    issued reset tokens automatically
    become invalid.
    """

    return hashlib.sha256(
        hashed_password.encode(
            "utf-8"
        )
    ).hexdigest()[:24]


# ============================================================
# PASSWORD RESET TOKEN
# ============================================================

def create_password_reset_token(
    user_id: int,
    hashed_password: str,
    expires_minutes: int = PASSWORD_RESET_EXPIRE_MINUTES,
) -> str:
    now = datetime.now(
        timezone.utc
    )

    expire = (
        now
        + timedelta(
            minutes=
                expires_minutes
        )
    )

    payload = {
        "sub":
            str(
                user_id
            ),

        "purpose":
            "password_reset",

        "pwdv":
            get_password_version(
                hashed_password
            ),

        "iat":
            now,

        "exp":
            expire,
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=
            JWT_ALGORITHM,
    )


def decode_password_reset_token(
    token: str,
) -> dict:
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[
                JWT_ALGORITHM
            ],
        )

        if (
            payload.get(
                "purpose"
            )
            != "password_reset"
        ):
            raise ValueError(
                "Invalid password "
                "reset token"
            )

        if not payload.get(
            "sub"
        ):
            raise ValueError(
                "Missing user ID "
                "in reset token"
            )

        if not payload.get(
            "pwdv"
        ):
            raise ValueError(
                "Invalid password "
                "reset token"
            )

        return payload

    except InvalidTokenError as exc:
        raise ValueError(
            "Invalid or expired "
            "password reset link"
        ) from exc