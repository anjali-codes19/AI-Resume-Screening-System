from __future__ import annotations

import app.services.ai_engine as ai_module


def build_engine() -> ai_module.AIEngine:
    ai_module.SentenceTransformer = None
    return ai_module.AIEngine()


def test_parse_resume_extracts_core_fields():
    engine = build_engine()
    text = """
    Aanya Patel
    Senior Machine Learning Engineer

    Skills
    Python, FastAPI, Machine Learning, NLP, PostgreSQL, Docker

    Experience
    Senior Machine Learning Engineer | TalentGrid | 2022 - Present
    - Built ranking services for recruiters.

    Projects
    Hiring Copilot
    - Created ATS scoring workflows.

    Education
    Master of Technology in Data Science
    """

    parsed = engine.parse_resume(text)

    assert parsed.name == "Aanya Patel"
    assert "Python" in parsed.skills
    assert parsed.education
    assert parsed.projects
    assert parsed.estimated_years_experience >= 3


def test_screening_outcome_identifies_missing_skills():
    engine = build_engine()
    resume_text = """
    Marcus Reed
    Staff Frontend Engineer

    Skills
    React, TypeScript, TailwindCSS, Recharts, Figma

    Experience
    Staff Frontend Engineer | LoopWorks | 2021 - Present
    """
    job_text = """
    Recruiter Analytics Frontend Lead

    Requirements
    - 6+ years of frontend engineering experience with React and TypeScript.
    - Deep experience with TailwindCSS and charting libraries such as Recharts.
    - Comfort collaborating with backend teams and accessibility best practices.
    """

    outcome = engine.screen_resume_against_job(resume_text, job_text)

    assert outcome.ats_score > 60
    assert "React" in outcome.matched_skills
    assert outcome.missing_skills or outcome.suggestions


def test_rank_candidates_orders_by_best_match():
    engine = build_engine()
    job_text = """
    Senior AI Platform Engineer
    Requirements
    - Strong Python, FastAPI, PostgreSQL, Docker, AWS, scikit-learn, and spaCy experience.
    """
    ranked = engine.rank_candidates(
        job_text=job_text,
        job_title="Senior AI Platform Engineer",
        candidates=[
            {
                "candidate_id": 1,
                "candidate_name": "Aanya Patel",
                "email": "aanya@example.com",
                "resume_id": 10,
                "resume_text": "Aanya Patel\nSkills\nPython, FastAPI, PostgreSQL, Docker, AWS, scikit-learn, spaCy\nExperience\n2020 - Present",
            },
            {
                "candidate_id": 2,
                "candidate_name": "Marcus Reed",
                "email": "marcus@example.com",
                "resume_id": 11,
                "resume_text": "Marcus Reed\nSkills\nReact, TypeScript, Recharts\nExperience\n2020 - Present",
            },
        ],
    )

    assert ranked[0].candidate_name == "Aanya Patel"
    assert ranked[0].outcome.ats_score >= ranked[1].outcome.ats_score
