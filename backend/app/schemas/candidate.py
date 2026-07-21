from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TrendPoint(BaseModel):
    label: str
    score: float


class ResumeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    extracted_name: str
    base_ats_score: float
    parsed_data: dict
    suggestions: list[str]
    created_at: datetime


class ResumeUploadResponse(BaseModel):
    resume: ResumeRead
    parsed_resume: dict


class CandidateScreeningSnapshot(BaseModel):
    screening_id: int
    job_id: int
    job_title: str
    ats_score: float
    ranking_position: int | None
    missing_skills: list[str]
    matched_skills: list[str]
    created_at: datetime


class CandidateSummary(BaseModel):
    total_resumes: int
    total_screenings: int
    latest_resume_score: float | None
    average_match_score: float | None


class CandidateDashboardResponse(BaseModel):
    summary: CandidateSummary
    score_trend: list[TrendPoint]
    top_skills: list[str]
    resumes: list[ResumeRead]
    screenings: list[CandidateScreeningSnapshot]
