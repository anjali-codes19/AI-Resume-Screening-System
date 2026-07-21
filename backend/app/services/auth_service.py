from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import ResourceConflictError
from app.core.security import hash_password, verify_password
from app.db.models import User, UserRole
from app.schemas.auth import RegisterRequest


class AuthService:
    def register_user(
        self, db: Session, payload: RegisterRequest, role: UserRole
    ) -> User:
        existing = db.scalar(select(User).where(User.email == payload.email))
        if existing:
            raise ResourceConflictError("An account with this email already exists")

        user = User(
            email=payload.email,
            full_name=payload.full_name,
            hashed_password=hash_password(payload.password),
            role=role,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def authenticate_user(self, db: Session, email: str, password: str) -> User | None:
        user = db.scalar(select(User).where(User.email == email.lower()))
        if not user or not verify_password(password, user.hashed_password):
            return None
        return user
