import hashlib
import os

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
# NORMAL ACCESS TOKEN
# ============================================================

def create_access_token(
    user_id: int,
    role: str,
    expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES,
) -> str:
    expire = (
        datetime.now(
            timezone.utc
        )
        + timedelta(
            minutes=expires_minutes
        )
    )

    payload = {
        "sub": str(user_id),
        "role": role,
        "purpose": "access",
        "exp": expire,
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
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
                "Missing user ID in token"
            )

        purpose = payload.get(
            "purpose"
        )

        if (
            purpose
            and purpose != "access"
        ):
            raise ValueError(
                "Invalid authentication token"
            )

        return payload

    except InvalidTokenError as exc:
        raise ValueError(
            "Invalid or expired authentication token"
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
            minutes=expires_minutes
        )
    )

    payload = {
        "sub": str(user_id),
        "purpose":
            "password_reset",
        "pwdv":
            get_password_version(
                hashed_password
            ),
        "iat": now,
        "exp": expire,
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
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
                "Invalid password reset token"
            )

        if not payload.get(
            "sub"
        ):
            raise ValueError(
                "Missing user ID in reset token"
            )

        if not payload.get(
            "pwdv"
        ):
            raise ValueError(
                "Invalid password reset token"
            )

        return payload

    except InvalidTokenError as exc:
        raise ValueError(
            "Invalid or expired password reset link"
        ) from exc