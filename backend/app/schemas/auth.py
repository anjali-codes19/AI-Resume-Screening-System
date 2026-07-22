from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.db.models import UserRole


def _validate_bcrypt_password(value: str) -> str:
    password = value.strip()
    if len(password.encode("utf-8")) > 72:
        raise ValueError("Password must be 72 bytes or fewer for bcrypt compatibility")
    return password


class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        if len(value.strip().split()) < 2:
            raise ValueError("Full name must include at least first and last name")
        return value.strip()

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or "." not in normalized.split("@")[-1]:
            raise ValueError("A valid email address is required")
        return normalized

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        password = _validate_bcrypt_password(value)
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if password.lower() == password or password.upper() == password:
            raise ValueError("Password must mix uppercase and lowercase characters")
        if not any(char.isdigit() for char in password):
            raise ValueError("Password must include at least one number")
        return password


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return _validate_bcrypt_password(value)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
