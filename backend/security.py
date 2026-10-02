import os
from datetime import datetime, timedelta, timezone

import jwt
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash


password_hash = PasswordHash.recommended()

JWT_SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY",
    "development-only-change-this-secret-key"
)

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    return password_hash.verify(
        plain_password,
        hashed_password
    )


def create_access_token(
    user_id: int,
    role: str,
    expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES
) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes
    )

    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire,
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM
    )


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM]
        )

        if not payload.get("sub"):
            raise ValueError("Missing user ID in token")

        return payload

    except InvalidTokenError as exc:
        raise ValueError(
            "Invalid or expired authentication token"
        ) from exc