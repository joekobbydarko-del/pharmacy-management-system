import re

from pydantic import BaseModel, EmailStr, field_validator


class SignUpRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, value):
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long.")

        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must contain at least one uppercase letter.")

        if not re.search(r"[0-9]", value):
            raise ValueError("Password must contain at least one number.")

        if not re.search(r"[!@#$%^&*]", value):
            raise ValueError(
                "Password must contain at least one special character such as @, #, ! or $."
            )

        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str