from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "TalentLens AI Resume Screening System"
    api_v1_prefix: str = "/api/v1"
    environment: str = "development"
    secret_key: str = "super-secret-change-me"
    token_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    database_url: str = "postgresql+psycopg://postgres:postgres@db:5432/resume_screening"
    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost",
        ]
    )
    uploads_dir: Path = BASE_DIR / "uploads"
    sentence_transformer_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    spacy_model: str = "en_core_web_sm"
    log_level: str = "INFO"
    seed_default_data: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @field_validator("uploads_dir", mode="before")
    @classmethod
    def parse_uploads_dir(cls, value: str | Path) -> Path:
        return Path(value)


@lru_cache
def get_settings() -> Settings:
    return Settings()
