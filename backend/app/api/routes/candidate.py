from __future__ import annotations

from collections import Counter

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.db.models import Resume, ScreeningResult, User, UserRole
from app.db.session import get_db
from app.schemas.candidate import (
    CandidateDashboardResponse,
    CandidateScreeningSnapshot,
    CandidateSummary,
    ResumeRead,
    ResumeUploadResponse,
    TrendPoint,
)
from app.services.ai_engine import AIEngine
from app.services.document_parser import DocumentParser
from app.services.storage import StorageService


router = APIRouter(prefix="/candidate", tags=["Candidate"])
ai_engine = AIEngine()
document_parser = DocumentParser()
storage_service = StorageService()


@router.get("/dashboard", response_model=CandidateDashboardResponse)
def get_candidate_dashboard(
    current_user: User = Depends(require_role(UserRole.candidate)),
    db: Session = Depends(get_db),
) -> CandidateDashboardResponse:
    resumes = db.scalars(
        select(Resume)
        .where(Resume.candidate_id == current_user.id)
        .order_by(Resume.created_at.desc())
    ).all()
    screenings = db.scalars(
        select(ScreeningResult)
        .where(ScreeningResult.candidate_id == current_user.id)
        .order_by(ScreeningResult.created_at.desc())
    ).all()

    trend = [
        TrendPoint(
            label=resume.created_at.strftime("%b %d"),
            score=resume.base_ats_score,
        )
        for resume in reversed(resumes[:6])
    ]

    skill_counter: Counter[str] = Counter()
    for resume in resumes:
        for skill in resume.parsed_data.get("skills", []):
            skill_counter.update([skill])

    screening_cards = [
        CandidateScreeningSnapshot(
            screening_id=result.id,
            job_id=result.job_id,
            job_title=result.job.title if result.job else "Open Role",
            ats_score=result.ats_score,
            ranking_position=result.ranking_position,
            missing_skills=result.missing_skills,
            matched_skills=result.matched_skills,
            created_at=result.created_at,
        )
        for result in screenings[:8]
    ]

    average_match_score = (
        round(sum(result.ats_score for result in screenings) / len(screenings), 1)
        if screenings
        else None
    )
    latest_score = resumes[0].base_ats_score if resumes else None

    return CandidateDashboardResponse(
        summary=CandidateSummary(
            total_resumes=len(resumes),
            total_screenings=len(screenings),
            latest_resume_score=latest_score,
            average_match_score=average_match_score,
        ),
        score_trend=trend,
        top_skills=[skill for skill, _ in skill_counter.most_common(8)],
        resumes=[ResumeRead.model_validate(resume) for resume in resumes],
        screenings=screening_cards,
    )


@router.get("/resumes", response_model=list[ResumeRead])
def list_resumes(
    current_user: User = Depends(require_role(UserRole.candidate)),
    db: Session = Depends(get_db),
) -> list[ResumeRead]:
    resumes = db.scalars(
        select(Resume)
        .where(Resume.candidate_id == current_user.id)
        .order_by(Resume.created_at.desc())
    ).all()
    return [ResumeRead.model_validate(resume) for resume in resumes]


@router.post("/resumes/upload", response_model=ResumeUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.candidate)),
    db: Session = Depends(get_db),
) -> ResumeUploadResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="A resume file is required")
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF resumes are supported")

    payload = await file.read()
    if not payload:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    resume_text = document_parser.extract_text_from_bytes(payload, file.filename)
    if not resume_text:
        raise HTTPException(status_code=400, detail="Unable to extract text from resume")

    parsed_resume = ai_engine.parse_resume(resume_text)
    base_ats_score, suggestions = ai_engine.analyze_resume_quality(
        parsed_resume, resume_text
    )
    stored_path = storage_service.save_bytes(payload, file.filename, "candidate-resumes")

    resume = Resume(
        candidate_id=current_user.id,
        filename=file.filename,
        file_path=str(stored_path),
        raw_text=resume_text,
        extracted_name=parsed_resume.name,
        parsed_data=parsed_resume.model_dump(),
        base_ats_score=base_ats_score,
        suggestions=suggestions,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    return ResumeUploadResponse(
        resume=ResumeRead.model_validate(resume),
        parsed_resume=parsed_resume.model_dump(),
    )
