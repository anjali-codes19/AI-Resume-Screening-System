from __future__ import annotations

import csv
import io

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import require_role
from app.db.models import JobDescription, Resume, ScreeningResult, User, UserRole
from app.db.session import get_db
from app.schemas.job import (
    CandidateRankingRow,
    JobCreateRequest,
    JobRead,
    PipelineMetric,
    RecruiterDashboardResponse,
    RecruiterSummary,
)
from app.services.ai_engine import AIEngine
from app.services.document_parser import DocumentParser
from app.services.storage import StorageService


router = APIRouter(prefix="/recruiter", tags=["Recruiter"])
ai_engine = AIEngine()
document_parser = DocumentParser()
storage_service = StorageService()


def _to_job_read(job: JobDescription, screenings: list[ScreeningResult]) -> JobRead:
    scores = [item.ats_score for item in screenings]
    return JobRead(
        id=job.id,
        title=job.title,
        department=job.department,
        location=job.location,
        employment_type=job.employment_type,
        description_text=job.description_text,
        parsed_requirements=job.parsed_requirements,
        created_at=job.created_at,
        candidate_count=len(screenings),
        average_score=round(sum(scores) / len(scores), 1) if scores else None,
    )


def _to_candidate_row(result: ScreeningResult) -> CandidateRankingRow:
    candidate = result.candidate
    return CandidateRankingRow(
        candidate_id=result.candidate_id,
        candidate_name=candidate.full_name if candidate else "Unknown Candidate",
        email=candidate.email if candidate else "",
        resume_id=result.resume_id,
        ats_score=result.ats_score,
        skill_match_score=result.skill_match_score,
        semantic_similarity=result.semantic_similarity,
        matched_skills=result.matched_skills,
        missing_skills=result.missing_skills,
        suggestions=result.suggestions,
        ranking_position=result.ranking_position,
        uploaded_at=result.resume.created_at if result.resume else None,
    )


@router.get("/dashboard", response_model=RecruiterDashboardResponse)
def get_recruiter_dashboard(
    current_user: User = Depends(require_role(UserRole.recruiter)),
    db: Session = Depends(get_db),
) -> RecruiterDashboardResponse:
    jobs = db.scalars(
        select(JobDescription)
        .where(JobDescription.recruiter_id == current_user.id)
        .order_by(JobDescription.created_at.desc())
    ).all()

    all_screenings = db.scalars(
        select(ScreeningResult)
        .join(JobDescription, ScreeningResult.job_id == JobDescription.id)
        .where(JobDescription.recruiter_id == current_user.id)
        .options(
            selectinload(ScreeningResult.candidate),
            selectinload(ScreeningResult.resume),
            selectinload(ScreeningResult.job),
        )
        .order_by(ScreeningResult.ats_score.desc())
    ).all()

    jobs_payload = [
        _to_job_read(job, [item for item in all_screenings if item.job_id == job.id])
        for job in jobs
    ]
    scores = [item.ats_score for item in all_screenings]

    pipeline = [
        PipelineMetric(
            label="Strong Fit",
            value=len([score for score in scores if score >= 85]),
        ),
        PipelineMetric(
            label="Review",
            value=len([score for score in scores if 70 <= score < 85]),
        ),
        PipelineMetric(
            label="Needs Work",
            value=len([score for score in scores if score < 70]),
        ),
    ]

    return RecruiterDashboardResponse(
        summary=RecruiterSummary(
            total_jobs=len(jobs),
            total_candidates=len({item.candidate_id for item in all_screenings}),
            screened_resumes=len(all_screenings),
            average_score=round(sum(scores) / len(scores), 1) if scores else None,
        ),
        pipeline=pipeline,
        jobs=jobs_payload,
        top_candidates=[_to_candidate_row(item) for item in all_screenings[:8]],
    )


@router.post("/jobs", response_model=JobRead, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobCreateRequest,
    current_user: User = Depends(require_role(UserRole.recruiter)),
    db: Session = Depends(get_db),
) -> JobRead:
    parsed_job = ai_engine.parse_job_description(payload.description_text, payload.title)
    job = JobDescription(
        recruiter_id=current_user.id,
        title=payload.title,
        department=payload.department,
        location=payload.location,
        employment_type=payload.employment_type,
        description_text=payload.description_text,
        parsed_requirements=parsed_job.model_dump(),
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return _to_job_read(job, [])


@router.post("/jobs/upload", response_model=JobRead, status_code=status.HTTP_201_CREATED)
async def upload_job_pdf(
    title: str = Form(...),
    department: str | None = Form(default=None),
    location: str | None = Form(default=None),
    employment_type: str | None = Form(default=None),
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.recruiter)),
    db: Session = Depends(get_db),
) -> JobRead:
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF job descriptions are supported")

    payload = await file.read()
    if not payload:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    description_text = document_parser.extract_text_from_bytes(payload, file.filename)
    if not description_text:
        raise HTTPException(status_code=400, detail="Unable to extract text from job description")

    stored_path = storage_service.save_bytes(payload, file.filename, "job-descriptions")
    parsed_job = ai_engine.parse_job_description(description_text, title)
    job = JobDescription(
        recruiter_id=current_user.id,
        title=title,
        department=department,
        location=location,
        employment_type=employment_type,
        description_text=description_text,
        file_path=str(stored_path),
        parsed_requirements=parsed_job.model_dump(),
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return _to_job_read(job, [])


@router.get("/jobs", response_model=list[JobRead])
def list_jobs(
    current_user: User = Depends(require_role(UserRole.recruiter)),
    db: Session = Depends(get_db),
) -> list[JobRead]:
    jobs = db.scalars(
        select(JobDescription)
        .where(JobDescription.recruiter_id == current_user.id)
        .order_by(JobDescription.created_at.desc())
    ).all()
    screenings = db.scalars(
        select(ScreeningResult)
        .join(JobDescription, ScreeningResult.job_id == JobDescription.id)
        .where(JobDescription.recruiter_id == current_user.id)
    ).all()
    return [_to_job_read(job, [item for item in screenings if item.job_id == job.id]) for job in jobs]


@router.post("/jobs/{job_id}/rank", response_model=list[CandidateRankingRow])
def rank_candidates_for_job(
    job_id: int,
    current_user: User = Depends(require_role(UserRole.recruiter)),
    db: Session = Depends(get_db),
) -> list[CandidateRankingRow]:
    job = db.scalar(
        select(JobDescription)
        .where(JobDescription.id == job_id, JobDescription.recruiter_id == current_user.id)
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found")

    resumes = db.scalars(
        select(Resume)
        .join(User, Resume.candidate_id == User.id)
        .where(User.role == UserRole.candidate)
        .options(selectinload(Resume.candidate))
        .order_by(Resume.candidate_id.asc(), Resume.created_at.desc())
    ).all()

    latest_resumes: dict[int, Resume] = {}
    for resume in resumes:
        latest_resumes.setdefault(resume.candidate_id, resume)

    if not latest_resumes:
        return []

    ranked = ai_engine.rank_candidates(
        job_text=job.description_text,
        job_title=job.title,
        candidates=[
            {
                "candidate_id": resume.candidate_id,
                "candidate_name": resume.candidate.full_name if resume.candidate else "Unknown Candidate",
                "email": resume.candidate.email if resume.candidate else "",
                "resume_id": resume.id,
                "resume_text": resume.raw_text,
                "uploaded_at": resume.created_at,
            }
            for resume in latest_resumes.values()
        ],
    )

    db.execute(delete(ScreeningResult).where(ScreeningResult.job_id == job.id))

    persisted: list[ScreeningResult] = []
    for index, ranked_candidate in enumerate(ranked, start=1):
        result = ScreeningResult(
            candidate_id=ranked_candidate.candidate_id,
            resume_id=ranked_candidate.resume_id,
            job_id=job.id,
            ats_score=ranked_candidate.outcome.ats_score,
            skill_match_score=ranked_candidate.outcome.skill_match_score,
            semantic_similarity=ranked_candidate.outcome.semantic_similarity,
            experience_score=ranked_candidate.outcome.experience_score,
            matched_skills=ranked_candidate.outcome.matched_skills,
            missing_skills=ranked_candidate.outcome.missing_skills,
            suggestions=ranked_candidate.outcome.suggestions,
            ranking_position=index,
        )
        db.add(result)
        persisted.append(result)

    db.commit()

    refreshed = db.scalars(
        select(ScreeningResult)
        .where(ScreeningResult.job_id == job.id)
        .options(
            selectinload(ScreeningResult.candidate),
            selectinload(ScreeningResult.resume),
        )
        .order_by(ScreeningResult.ranking_position.asc())
    ).all()
    return [_to_candidate_row(result) for result in refreshed]


@router.get("/jobs/{job_id}/candidates", response_model=list[CandidateRankingRow])
def get_ranked_candidates(
    job_id: int,
    current_user: User = Depends(require_role(UserRole.recruiter)),
    db: Session = Depends(get_db),
) -> list[CandidateRankingRow]:
    job = db.scalar(
        select(JobDescription)
        .where(JobDescription.id == job_id, JobDescription.recruiter_id == current_user.id)
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found")

    results = db.scalars(
        select(ScreeningResult)
        .where(ScreeningResult.job_id == job.id)
        .options(
            selectinload(ScreeningResult.candidate),
            selectinload(ScreeningResult.resume),
        )
        .order_by(ScreeningResult.ranking_position.asc(), ScreeningResult.ats_score.desc())
    ).all()
    return [_to_candidate_row(result) for result in results]


@router.get("/jobs/{job_id}/report")
def download_job_report(
    job_id: int,
    current_user: User = Depends(require_role(UserRole.recruiter)),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    job = db.scalar(
        select(JobDescription)
        .where(JobDescription.id == job_id, JobDescription.recruiter_id == current_user.id)
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found")

    results = db.scalars(
        select(ScreeningResult)
        .where(ScreeningResult.job_id == job.id)
        .options(
            selectinload(ScreeningResult.candidate),
            selectinload(ScreeningResult.resume),
        )
        .order_by(ScreeningResult.ranking_position.asc(), ScreeningResult.ats_score.desc())
    ).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "Rank",
            "Candidate",
            "Email",
            "ATS Score",
            "Skill Match",
            "Semantic Similarity",
            "Matched Skills",
            "Missing Skills",
            "Suggestions",
        ]
    )
    for result in results:
        writer.writerow(
            [
                result.ranking_position or "",
                result.candidate.full_name if result.candidate else "",
                result.candidate.email if result.candidate else "",
                result.ats_score,
                result.skill_match_score,
                result.semantic_similarity,
                ", ".join(result.matched_skills),
                ", ".join(result.missing_skills),
                " | ".join(result.suggestions),
            ]
        )

    output.seek(0)
    headers = {"Content-Disposition": f'attachment; filename="{job.title.lower().replace(" ", "-")}-report.csv"'}
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers=headers)
