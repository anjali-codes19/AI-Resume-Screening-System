from fastapi import APIRouter

from app.api.routes import auth, candidate, recruiter


api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(candidate.router)
api_router.include_router(recruiter.router)
