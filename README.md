# TalentLens AI Resume Screening System

TalentLens is a production-ready AI resume screening platform with separate candidate and recruiter workflows, PDF parsing, ATS scoring, semantic matching, candidate ranking, downloadable reports, JWT auth, seed data, tests, and Docker Compose deployment.

## Stack

- Frontend: React, TypeScript, TailwindCSS, Framer Motion, Recharts
- Backend: FastAPI, Python, scikit-learn, Sentence Transformers, spaCy
- Database: PostgreSQL
- Auth: JWT
- Deployment: Docker Compose + Nginx

## Key Features

- Candidate module
  - Register and login
  - Upload PDF resumes
  - Resume history and ATS trend tracking
  - AI suggestions for resume improvements
  - Job match snapshots from recruiter screenings
- Recruiter module
  - Register and login
  - Create job descriptions from text
  - Upload JD PDFs
  - Rank candidates against roles
  - Download CSV screening reports
- AI engine
  - Parse PDF resumes and JDs
  - Extract name, skills, education, projects, and experience
  - Generate ATS score, skill match, missing skills, ranking, and suggestions
  - Fallback gracefully to TF-IDF heuristics if transformer weights are not cached locally

## Demo Credentials

- Candidate
  - Email: `aanya.patel@example.com`
  - Password: `Candidate123`
- Recruiter
  - Email: `sara.kim@talentlens.ai`
  - Password: `Recruiter123`

## Project Structure

```text
.
├── backend
│   ├── app
│   │   ├── api
│   │   ├── core
│   │   ├── db
│   │   ├── schemas
│   │   ├── services
│   │   └── utils
│   ├── scripts
│   ├── seed_assets
│   ├── tests
│   ├── Dockerfile
│   └── requirements.txt
├── frontend
│   ├── src
│   │   ├── api
│   │   ├── components
│   │   ├── contexts
│   │   ├── lib
│   │   ├── pages
│   │   └── types
│   └── Dockerfile
├── infra
│   └── nginx
└── docker-compose.yml
```

## Local Development

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python scripts/seed_db.py
uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000` and Swagger is available at `http://localhost:8000/docs`.

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.

Set `VITE_API_BASE_URL=http://localhost:8000/api/v1` when running the frontend outside Docker Compose.

## Docker Compose

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`

## Testing

Run backend tests:

```bash
cd backend
pytest tests
```

## Seed Data and Dummy PDFs

Realistic seed profiles and job descriptions live in `backend/seed_assets/profiles`.

Generate sample PDF resumes and JDs:

```bash
cd backend
python scripts/generate_dummy_resumes.py
```

The generated files are written to `backend/seed_assets/generated`.

## API Overview

- `POST /api/v1/auth/register/candidate`
- `POST /api/v1/auth/register/recruiter`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/candidate/dashboard`
- `GET /api/v1/candidate/resumes`
- `POST /api/v1/candidate/resumes/upload`
- `GET /api/v1/recruiter/dashboard`
- `POST /api/v1/recruiter/jobs`
- `POST /api/v1/recruiter/jobs/upload`
- `GET /api/v1/recruiter/jobs`
- `POST /api/v1/recruiter/jobs/{job_id}/rank`
- `GET /api/v1/recruiter/jobs/{job_id}/candidates`
- `GET /api/v1/recruiter/jobs/{job_id}/report`

## Notes

- The backend auto-creates tables on startup and seeds data when `SEED_DEFAULT_DATA=true`.
- Sentence Transformer loading uses `local_files_only=True` so the app remains bootable in offline or restricted environments.
- The AI scoring engine is intentionally hybrid: deterministic ATS heuristics plus semantic similarity when embeddings are available.
