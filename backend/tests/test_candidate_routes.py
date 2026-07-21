from __future__ import annotations


def authenticate_candidate(client) -> str:
    response = client.post(
        "/api/v1/auth/register/candidate",
        json={
            "full_name": "Taylor Hudson",
            "email": "taylor.hudson@example.com",
            "password": "Password123",
        },
    )
    assert response.status_code == 201
    return response.json()["access_token"]


def test_resume_upload_returns_score_and_parsed_fields(client):
    token = authenticate_candidate(client)
    response = client.post(
        "/api/v1/candidate/resumes/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={
            "file": (
                "taylor-hudson.pdf",
                b"Taylor Hudson\nSkills\nPython, FastAPI, PostgreSQL\nExperience\n2021 - Present\nEducation\nBachelor of Science in Computer Science",
                "application/pdf",
            )
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["resume"]["base_ats_score"] > 0
    assert "Python" in body["parsed_resume"]["skills"]
