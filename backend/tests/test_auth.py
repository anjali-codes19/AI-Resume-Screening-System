from __future__ import annotations


def test_candidate_register_and_login(client):
    register_response = client.post(
        "/api/v1/auth/register/candidate",
        json={
            "full_name": "Jordan Blake",
            "email": "jordan.blake@example.com",
            "password": "Password123",
        },
    )

    assert register_response.status_code == 201
    token = register_response.json()["access_token"]
    assert token

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "jordan.blake@example.com", "password": "Password123"},
    )

    assert login_response.status_code == 200
    assert login_response.json()["user"]["role"] == "candidate"


def test_candidate_dashboard_requires_token(client):
    response = client.get("/api/v1/candidate/dashboard")
    assert response.status_code == 401
