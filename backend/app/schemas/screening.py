from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class ParsedResume(BaseModel):
    name: str
    skills: list[str]
    education: list[str]
    projects: list[str]
    experience: list[str]
    estimated_years_experience: float
    sections: dict[str, list[str]]


class ParsedJobDescription(BaseModel):
    title: str
    skills: list[str]
    education_preferences: list[str]
    responsibilities: list[str]
    required_years_experience: float


class ScreeningOutcome(BaseModel):
    parsed_resume: ParsedResume
    parsed_job: ParsedJobDescription
    quality_score: float
    skill_match_score: float
    semantic_similarity: float
    experience_score: float
    education_score: float
    ats_score: float
    matched_skills: list[str]
    missing_skills: list[str]
    suggestions: list[str]


class RankedCandidate(BaseModel):
    candidate_id: int
    candidate_name: str
    email: str
    resume_id: int
    uploaded_at: datetime | None = None
    outcome: ScreeningOutcome
