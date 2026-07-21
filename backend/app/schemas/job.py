from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class JobCreateRequest(BaseModel):
    title: str
    description_text: str
    department: str | None = None
    location: str | None = None
    employment_type: str | None = None

    @field_validator("title", "description_text")
    @classmethod
    def require_value(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("This field is required")
        return stripped


class JobRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    department: str | None
    location: str | None
    employment_type: str | None
    description_text: str
    parsed_requirements: dict
    created_at: datetime
    candidate_count: int = 0
    average_score: float | None = None


class CandidateRankingRow(BaseModel):
    candidate_id: int
    candidate_name: str
    email: str
    resume_id: int
    ats_score: float
    skill_match_score: float
    semantic_similarity: float
    matched_skills: list[str]
    missing_skills: list[str]
    suggestions: list[str]
    ranking_position: int | None
    uploaded_at: datetime | None = None


class RecruiterSummary(BaseModel):
    total_jobs: int
    total_candidates: int
    screened_resumes: int
    average_score: float | None


class PipelineMetric(BaseModel):
    label: str
    value: int


class RecruiterDashboardResponse(BaseModel):
    summary: RecruiterSummary
    pipeline: list[PipelineMetric]
    jobs: list[JobRead]
    top_candidates: list[CandidateRankingRow]
