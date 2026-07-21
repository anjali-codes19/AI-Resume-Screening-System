from __future__ import annotations

import enum
from datetime import UTC, datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UserRole(str, enum.Enum):
    candidate = "candidate"
    recruiter = "recruiter"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole))
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )

    resumes: Mapped[list["Resume"]] = relationship(
        back_populates="candidate",
        cascade="all, delete-orphan",
        foreign_keys="Resume.candidate_id",
    )
    jobs: Mapped[list["JobDescription"]] = relationship(
        back_populates="recruiter",
        cascade="all, delete-orphan",
        foreign_keys="JobDescription.recruiter_id",
    )
    screenings: Mapped[list["ScreeningResult"]] = relationship(
        back_populates="candidate",
        cascade="all, delete-orphan",
        foreign_keys="ScreeningResult.candidate_id",
    )


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    filename: Mapped[str] = mapped_column(String(255))
    file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    raw_text: Mapped[str] = mapped_column(Text)
    extracted_name: Mapped[str] = mapped_column(String(255))
    parsed_data: Mapped[dict] = mapped_column(JSON, default=dict)
    base_ats_score: Mapped[float] = mapped_column(Float, default=0)
    suggestions: Mapped[list[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )

    candidate: Mapped["User"] = relationship(
        back_populates="resumes", foreign_keys=[candidate_id]
    )
    screening_results: Mapped[list["ScreeningResult"]] = relationship(
        back_populates="resume",
        cascade="all, delete-orphan",
    )


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    recruiter_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    department: Mapped[str | None] = mapped_column(String(255), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    employment_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description_text: Mapped[str] = mapped_column(Text)
    file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    parsed_requirements: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )

    recruiter: Mapped["User"] = relationship(
        back_populates="jobs", foreign_keys=[recruiter_id]
    )
    screenings: Mapped[list["ScreeningResult"]] = relationship(
        back_populates="job",
        cascade="all, delete-orphan",
    )


class ScreeningResult(Base):
    __tablename__ = "screening_results"
    __table_args__ = (UniqueConstraint("resume_id", "job_id", name="uq_resume_job"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    resume_id: Mapped[int] = mapped_column(ForeignKey("resumes.id"), index=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("job_descriptions.id"), index=True)
    ats_score: Mapped[float] = mapped_column(Float, default=0)
    skill_match_score: Mapped[float] = mapped_column(Float, default=0)
    semantic_similarity: Mapped[float] = mapped_column(Float, default=0)
    experience_score: Mapped[float] = mapped_column(Float, default=0)
    matched_skills: Mapped[list[str]] = mapped_column(JSON, default=list)
    missing_skills: Mapped[list[str]] = mapped_column(JSON, default=list)
    suggestions: Mapped[list[str]] = mapped_column(JSON, default=list)
    ranking_position: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )

    candidate: Mapped["User"] = relationship(
        back_populates="screenings", foreign_keys=[candidate_id]
    )
    resume: Mapped["Resume"] = relationship(back_populates="screening_results")
    job: Mapped["JobDescription"] = relationship(back_populates="screenings")
