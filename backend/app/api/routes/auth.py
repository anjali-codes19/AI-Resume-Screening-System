from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token
from app.db.models import User, UserRole
from app.db.session import get_db
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserRead
from app.services.auth_service import AuthService


router = APIRouter(prefix="/auth", tags=["Authentication"])
auth_service = AuthService()


def _build_token_response(user: User) -> TokenResponse:
    token = create_access_token(subject=str(user.id), role=user.role.value)
    return TokenResponse(access_token=token, user=UserRead.model_validate(user))


@router.post("/register/candidate", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_candidate(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = auth_service.register_user(db, payload, UserRole.candidate)
    return _build_token_response(user)


@router.post("/register/recruiter", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_recruiter(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = auth_service.register_user(db, payload, UserRole.recruiter)
    return _build_token_response(user)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = auth_service.authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    return _build_token_response(user)


@router.get("/me", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)
