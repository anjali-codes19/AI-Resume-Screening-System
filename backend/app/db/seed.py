from __future__ import annotations

import json
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.models import JobDescription, Resume, ScreeningResult, User, UserRole
from app.services.ai_engine import AIEngine


ASSET_DIR = Path(__file__).resolve().parents[2] / "seed_assets" / "profiles"


def _load_json(filename: str) -> list[dict]:
    return json.loads((ASSET_DIR / filename).read_text())


def _resume_text_from_profile(profile: dict) -> str:
    lines = [
        profile["full_name"],
        profile["headline"],
        profile["location"],
        "",
        "Professional Summary",
        profile["summary"],
        "",
        "Skills",
        ", ".join(profile["skills"]),
        "",
        "Experience",
    ]
    for experience in profile["experience"]:
        lines.append(
            f'{experience["role"]} | {experience["company"]} | {experience["start"]} - {experience["end"]}'
        )
        lines.extend(f"- {highlight}" for highlight in experience["highlights"])
    lines.extend(["", "Projects"])
    for project in profile["projects"]:
        lines.append(f'{project["name"]} ({project["stack"]})')
        lines.append(f'- {project["impact"]}')
    lines.extend(["", "Education"])
    lines.extend(profile["education"])
    return "\n".join(lines)


def _job_text_from_profile(job: dict) -> str:
    lines = [
        job["title"],
        f'Department: {job["department"]}',
        f'Location: {job["location"]}',
        f'Employment Type: {job["employment_type"]}',
        "",
        "Summary",
        job["summary"],
        "",
        "Requirements",
    ]
    lines.extend(f"- {requirement}" for requirement in job["requirements"])
    lines.extend(["", "Responsibilities"])
    lines.extend(f"- {responsibility}" for responsibility in job["responsibilities"])
    return "\n".join(lines)


def seed_default_dataset(db: Session) -> None:
    existing_users = db.scalar(select(func.count()).select_from(User))
    if existing_users and existing_users > 0:
        return

    ai_engine = AIEngine()
    profiles = _load_json("sample_profiles.json")
    jobs = _load_json("sample_jobs.json")

    recruiter = User(
        email="sara.kim@talentlens.ai",
        full_name="Sara Kim",
        hashed_password=hash_password("Recruiter123"),
        role=UserRole.recruiter,
        is_active=True,
    )
    db.add(recruiter)
    db.flush()

    candidate_users: list[User] = []
    resumes: list[Resume] = []
    for profile in profiles:
        candidate = User(
            email=profile["email"],
            full_name=profile["full_name"],
            hashed_password=hash_password("Candidate123"),
            role=UserRole.candidate,
            is_active=True,
        )
        db.add(candidate)
        db.flush()
        candidate_users.append(candidate)

        resume_text = _resume_text_from_profile(profile)
        parsed_resume = ai_engine.parse_resume(resume_text)
        quality_score, suggestions = ai_engine.analyze_resume_quality(
            parsed_resume, resume_text
        )
        resume = Resume(
            candidate_id=candidate.id,
            filename=f'{profile["full_name"].lower().replace(" ", "-")}.pdf',
            file_path=None,
            raw_text=resume_text,
            extracted_name=parsed_resume.name,
            parsed_data=parsed_resume.model_dump(),
            base_ats_score=quality_score,
            suggestions=suggestions,
        )
        db.add(resume)
        db.flush()
        resumes.append(resume)

    created_jobs: list[JobDescription] = []
    for job_payload in jobs:
        description_text = _job_text_from_profile(job_payload)
        parsed_job = ai_engine.parse_job_description(description_text, job_payload["title"])
        job = JobDescription(
            recruiter_id=recruiter.id,
            title=job_payload["title"],
            department=job_payload["department"],
            location=job_payload["location"],
            employment_type=job_payload["employment_type"],
            description_text=description_text,
            file_path=None,
            parsed_requirements=parsed_job.model_dump(),
        )
        db.add(job)
        db.flush()
        created_jobs.append(job)

    for job in created_jobs:
        ranked = ai_engine.rank_candidates(
            job_text=job.description_text,
            job_title=job.title,
            candidates=[
                {
                    "candidate_id": resume.candidate_id,
                    "candidate_name": resume.candidate.full_name if resume.candidate else "",
                    "email": resume.candidate.email if resume.candidate else "",
                    "resume_id": resume.id,
                    "resume_text": resume.raw_text,
                    "uploaded_at": resume.created_at,
                }
                for resume in resumes
            ],
        )
        for index, ranked_candidate in enumerate(ranked, start=1):
            db.add(
                ScreeningResult(
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
            )

    db.commit()
