from __future__ import annotations

import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


TEST_DB_PATH = Path(__file__).resolve().parent / "test_resume_screening.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"
os.environ["SEED_DEFAULT_DATA"] = "false"
os.environ["SECRET_KEY"] = "test-secret"

from app.db.base import Base  # noqa: E402
from app.db.session import SessionLocal, engine, get_db  # noqa: E402
from app.main import create_application  # noqa: E402


@pytest.fixture()
def db_session():
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        if TEST_DB_PATH.exists():
            TEST_DB_PATH.unlink()


@pytest.fixture()
def client(db_session):
    app = create_application()

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
