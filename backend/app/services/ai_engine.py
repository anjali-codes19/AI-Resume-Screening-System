from __future__ import annotations

import re
from collections import Counter
from typing import Any

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.schemas.screening import ParsedJobDescription, ParsedResume, RankedCandidate, ScreeningOutcome
from app.utils.skills_taxonomy import COMMON_SKILLS, SKILL_SYNONYMS

try:
    import spacy
except Exception:  # pragma: no cover - optional dependency fallback
    spacy = None

try:
    from sentence_transformers import SentenceTransformer
except Exception:  # pragma: no cover - optional dependency fallback
    SentenceTransformer = None


class AIEngine:
    section_aliases = {
        "professional summary": "summary",
        "summary": "summary",
        "profile": "summary",
        "skills": "skills",
        "technical skills": "skills",
        "core competencies": "skills",
        "education": "education",
        "projects": "projects",
        "selected projects": "projects",
        "experience": "experience",
        "work experience": "experience",
        "employment history": "experience",
        "responsibilities": "responsibilities",
        "requirements": "requirements",
        "preferred qualifications": "requirements",
        "certifications": "education",
    }

    def __init__(self, sentence_model_name: str | None = None, spacy_model: str | None = None) -> None:
        self.sentence_model_name = sentence_model_name or "sentence-transformers/all-MiniLM-L6-v2"
        self.spacy_model = spacy_model or "en_core_web_sm"
        self.nlp = self._load_spacy_model()
        self.embedding_model = self._load_embedding_model()

    def parse_resume(self, text: str) -> ParsedResume:
        normalized = self._normalize_text(text)
        sections = self._split_sections(normalized)
        education = self._extract_education(normalized, sections)
        experience = self._extract_section_items(sections, ["experience"])
        projects = self._extract_section_items(sections, ["projects"])
        return ParsedResume(
            name=self._extract_name(normalized),
            skills=self._extract_skills(normalized),
            education=education,
            projects=projects,
            experience=experience,
            estimated_years_experience=self._estimate_experience_years(
                normalized, experience
            ),
            sections=sections,
        )

    def parse_job_description(
        self, text: str, title_hint: str | None = None
    ) -> ParsedJobDescription:
        normalized = self._normalize_text(text)
        sections = self._split_sections(normalized)
        responsibilities = self._extract_section_items(
            sections, ["responsibilities", "experience", "summary"]
        )[:10]
        education = self._extract_education(normalized, sections)
        title = title_hint or self._extract_job_title(normalized)
        return ParsedJobDescription(
            title=title,
            skills=self._extract_skills(normalized),
            education_preferences=education,
            responsibilities=responsibilities,
            required_years_experience=self._extract_required_experience(normalized),
        )

    def analyze_resume_quality(
        self, parsed_resume: ParsedResume, raw_text: str | None = None
    ) -> tuple[float, list[str]]:
        score = 35.0
        suggestions: list[str] = []
        text = self._normalize_text(raw_text or "")

        if parsed_resume.name:
            score += 8
        if parsed_resume.skills:
            score += min(18, len(parsed_resume.skills) * 2)
        else:
            suggestions.append("Add a dedicated skills section with tools and frameworks.")
        if parsed_resume.education:
            score += 8
        else:
            suggestions.append("Include education, certifications, or formal training.")
        if parsed_resume.experience:
            score += 12
        else:
            suggestions.append("Add a clear experience section with recent roles.")
        if parsed_resume.projects:
            score += 9
        else:
            suggestions.append("Showcase 2-3 projects with impact and technology choices.")
        if self._has_quantified_impact(text):
            score += 10
        else:
            suggestions.append("Quantify achievements with metrics, percentages, or cost savings.")

        score = min(score, 100.0)
        if score >= 85 and not suggestions:
            suggestions.append("Resume quality is strong. Tailor keywords to each job description.")
        return round(score, 1), suggestions[:4]

    def screen_resume_against_job(
        self, resume_text: str, job_text: str, job_title: str | None = None
    ) -> ScreeningOutcome:
        parsed_resume = self.parse_resume(resume_text)
        parsed_job = self.parse_job_description(job_text, title_hint=job_title)
        quality_score, quality_suggestions = self.analyze_resume_quality(
            parsed_resume, resume_text
        )

        matched_skills = sorted(set(parsed_resume.skills) & set(parsed_job.skills))
        missing_skills = sorted(set(parsed_job.skills) - set(parsed_resume.skills))

        skill_match_score = (
            len(matched_skills) / len(parsed_job.skills) if parsed_job.skills else 0.75
        )
        semantic_similarity = self._semantic_similarity(resume_text, job_text)
        experience_score = self._experience_alignment(
            parsed_resume.estimated_years_experience,
            parsed_job.required_years_experience,
        )
        education_score = self._education_alignment(
            parsed_resume.education, parsed_job.education_preferences
        )

        ats_score = round(
            (
                (skill_match_score * 0.40)
                + (semantic_similarity * 0.25)
                + (experience_score * 0.15)
                + (education_score * 0.10)
                + ((quality_score / 100.0) * 0.10)
            )
            * 100,
            1,
        )

        suggestions = self._build_screening_suggestions(
            parsed_resume=parsed_resume,
            parsed_job=parsed_job,
            missing_skills=missing_skills,
            quality_suggestions=quality_suggestions,
            experience_score=experience_score,
            raw_text=resume_text,
        )

        return ScreeningOutcome(
            parsed_resume=parsed_resume,
            parsed_job=parsed_job,
            quality_score=quality_score,
            skill_match_score=round(skill_match_score * 100, 1),
            semantic_similarity=round(semantic_similarity * 100, 1),
            experience_score=round(experience_score * 100, 1),
            education_score=round(education_score * 100, 1),
            ats_score=ats_score,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            suggestions=suggestions,
        )

    def rank_candidates(
        self, job_text: str, candidates: list[dict[str, Any]], job_title: str | None = None
    ) -> list[RankedCandidate]:
        ranked: list[RankedCandidate] = []
        for entry in candidates:
            outcome = self.screen_resume_against_job(
                resume_text=entry["resume_text"],
                job_text=job_text,
                job_title=job_title,
            )
            ranked.append(
                RankedCandidate(
                    candidate_id=entry["candidate_id"],
                    candidate_name=entry["candidate_name"],
                    email=entry["email"],
                    resume_id=entry["resume_id"],
                    uploaded_at=entry.get("uploaded_at"),
                    outcome=outcome,
                )
            )

        return sorted(ranked, key=lambda item: item.outcome.ats_score, reverse=True)

    def _load_spacy_model(self):  # pragma: no cover - optional dependency branch
        if spacy is None:
            return None
        try:
            return spacy.load(self.spacy_model)
        except Exception:
            nlp = spacy.blank("en")
            if "sentencizer" not in nlp.pipe_names:
                nlp.add_pipe("sentencizer")
            return nlp

    def _load_embedding_model(self):  # pragma: no cover - optional dependency branch
        if SentenceTransformer is None:
            return None
        try:
            return SentenceTransformer(self.sentence_model_name, local_files_only=True)
        except Exception:
            return None

    def _normalize_text(self, text: str) -> str:
        normalized = text.replace("\r", "\n").replace("\t", " ")
        normalized = re.sub(r"\n{3,}", "\n\n", normalized)
        return normalized.strip()

    def _split_sections(self, text: str) -> dict[str, list[str]]:
        sections: dict[str, list[str]] = {"general": []}
        current = "general"
        for raw_line in text.splitlines():
            line = raw_line.strip().strip(":")
            if not line:
                continue
            alias = self.section_aliases.get(line.lower())
            if alias:
                current = alias
                sections.setdefault(current, [])
                continue
            sections.setdefault(current, []).append(line)
        return sections

    def _extract_name(self, text: str) -> str:
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        if self.nlp is not None:
            doc = self.nlp(" ".join(lines[:4]))
            for ent in getattr(doc, "ents", []):
                if ent.label_ == "PERSON" and 1 < len(ent.text.split()) <= 4:
                    return ent.text.strip()
        if lines:
            candidate = lines[0]
            if 1 < len(candidate.split()) <= 4 and len(candidate) < 50:
                return candidate
        return "Unknown Candidate"

    def _extract_job_title(self, text: str) -> str:
        first_line = next((line.strip() for line in text.splitlines() if line.strip()), "")
        if first_line and len(first_line.split()) <= 8:
            return first_line
        title_match = re.search(r"(?i)(?:role|position|title)\s*[:\-]\s*([^\n]+)", text)
        return title_match.group(1).strip() if title_match else "Open Role"

    def _extract_skills(self, text: str) -> list[str]:
        lowered = text.lower()
        matched: list[str] = []
        for canonical in COMMON_SKILLS:
            aliases = SKILL_SYNONYMS.get(canonical, [canonical.lower()])
            if any(self._contains_term(lowered, alias.lower()) for alias in aliases):
                matched.append(canonical)
        return sorted(set(matched))

    def _contains_term(self, text: str, term: str) -> bool:
        return bool(re.search(rf"(?<!\w){re.escape(term)}(?!\w)", text))

    def _extract_education(self, text: str, sections: dict[str, list[str]]) -> list[str]:
        lines = self._extract_section_items(sections, ["education"])
        if lines:
            return lines[:5]

        matches = re.findall(
            r"(?im)^.*(?:bachelor|master|mba|phd|b\.tech|m\.tech|bs|ms|university|college).*$",
            text,
        )
        return list(dict.fromkeys(match.strip() for match in matches if match.strip()))[:5]

    def _extract_section_items(
        self, sections: dict[str, list[str]], keys: list[str]
    ) -> list[str]:
        items: list[str] = []
        for key in keys:
            items.extend(sections.get(key, []))
        cleaned = [item.lstrip("-• ").strip() for item in items if item.strip()]
        return cleaned

    def _estimate_experience_years(self, text: str, experience_lines: list[str]) -> float:
        year_matches = re.findall(
            r"(?P<start>(?:19|20)\d{2})\s*(?:-|–|to)\s*(?P<end>present|current|now|(?:19|20)\d{2})",
            text,
            flags=re.IGNORECASE,
        )
        if year_matches:
            starts = [int(start) for start, _ in year_matches]
            ends = [
                2026 if end.lower() in {"present", "current", "now"} else int(end)
                for _, end in year_matches
            ]
            if starts and ends:
                return round(max(0, max(ends) - min(starts)), 1)

        direct = re.findall(r"(\d+(?:\.\d+)?)\+?\s+years", text, flags=re.IGNORECASE)
        if direct:
            return round(max(float(value) for value in direct), 1)

        return 3.0 if experience_lines else 0.0

    def _extract_required_experience(self, text: str) -> float:
        direct = re.findall(
            r"(\d+(?:\.\d+)?)\+?\s+years(?:\s+of)?\s+experience",
            text,
            flags=re.IGNORECASE,
        )
        if direct:
            return round(max(float(value) for value in direct), 1)
        return 2.0

    def _semantic_similarity(self, source: str, target: str) -> float:
        if self.embedding_model is not None:  # pragma: no branch
            try:  # pragma: no cover - depends on optional model availability
                embeddings = self.embedding_model.encode([source, target])
                score = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
                return float(max(0.0, min(1.0, score)))
            except Exception:
                pass

        vectorizer = TfidfVectorizer(stop_words="english")
        matrix = vectorizer.fit_transform([source, target])
        score = cosine_similarity(matrix[0:1], matrix[1:2])[0][0]
        return float(max(0.0, min(1.0, score)))

    def _experience_alignment(self, resume_years: float, required_years: float) -> float:
        if required_years <= 0:
            return 1.0
        if resume_years >= required_years:
            return 1.0
        return max(0.0, resume_years / required_years)

    def _education_alignment(
        self, education_lines: list[str], preferences: list[str]
    ) -> float:
        if not preferences:
            return 0.9 if education_lines else 0.5
        resume_text = " ".join(education_lines).lower()
        required_terms = {
            "bachelor": ["bachelor", "bs", "b.tech"],
            "master": ["master", "ms", "m.tech", "mba"],
            "phd": ["phd", "doctorate"],
        }
        matches = 0
        for pref in preferences:
            lowered = pref.lower()
            if any(alias in resume_text for aliases in required_terms.values() for alias in aliases if alias in lowered):
                matches += 1
        if matches:
            return min(1.0, matches / max(1, len(preferences)))
        return 0.5 if education_lines else 0.2

    def _has_quantified_impact(self, text: str) -> bool:
        return bool(
            re.search(r"\b\d+%|\b\d+x\b|\$\d+|\b\d+\s+(?:users|clients|hours|days)\b", text)
        )

    def _build_screening_suggestions(
        self,
        parsed_resume: ParsedResume,
        parsed_job: ParsedJobDescription,
        missing_skills: list[str],
        quality_suggestions: list[str],
        experience_score: float,
        raw_text: str,
    ) -> list[str]:
        suggestions: list[str] = []
        if missing_skills:
            suggestions.append(
                f"Add credible examples or certifications for: {', '.join(missing_skills[:5])}."
            )
        if experience_score < 0.7:
            suggestions.append(
                f"Emphasize leadership scope and transferable wins to bridge the {parsed_job.required_years_experience:.0f}+ years requirement."
            )
        if not parsed_resume.projects:
            suggestions.append("Include project case studies that mirror the target role.")
        if not self._has_quantified_impact(raw_text):
            suggestions.append("Rewrite bullets to highlight measurable business outcomes.")

        suggestions.extend(quality_suggestions)
        deduplicated = list(dict.fromkeys(suggestions))
        return deduplicated[:5]

    def top_skills(self, parsed_resumes: list[ParsedResume]) -> list[str]:
        counter: Counter[str] = Counter()
        for resume in parsed_resumes:
            counter.update(resume.skills)
        return [skill for skill, _ in counter.most_common(8)]
