# backend/app/matching/keyword_matcher.py
import re
from app.ai.schemas.resume_schemas import ParsedResume
from app.ai.schemas.job_schemas import ParsedJob


def _normalize(term: str) -> str:
    return re.sub(r"[^a-z0-9+#.]", "", term.lower())


def compute_keyword_overlap(resume: ParsedResume, job: ParsedJob) -> float:
    """Returns 0.0–100.0: % of job's must-have keywords found in resume."""
    resume_terms = {
        _normalize(t) for t in resume.skills + resume.technologies if t
    }
    must_have = [_normalize(k) for k in job.must_have_skills + job.ats_keywords if k]
    if not must_have:
        return 100.0
    matched = sum(1 for k in must_have if k in resume_terms)
    return round((matched / len(must_have)) * 100, 1)


def compute_experience_score(resume: ParsedResume, job: ParsedJob) -> float:
    """Returns 0.0–100.0 based on years of experience vs job requirement."""
    required = job.min_years_experience or 0
    actual = resume.years_of_experience or 0
    if required == 0:
        return 100.0
    ratio = min(actual / required, 1.5)  # cap bonus at 1.5x
    return round(min(ratio * 100, 100), 1)
