# backend/app/matching/match_engine.py
from app.ai.schemas.job_schemas import ParsedJob
from app.ai.schemas.resume_schemas import ParsedResume
from app.matching.keyword_matcher import compute_experience_score, compute_keyword_overlap


async def compute_combined_match_score(
    resume: ParsedResume,
    job: ParsedJob,
    resume_id: str | None = None,
    job_id: str | None = None,
    ai_score: float | None = None,
) -> float:
    """
    Weighted score:
      - AI agent match score:    40%
      - Keyword overlap score:   35%
      - Experience score:        25%
    If resume_id + job_id provided, also computes semantic similarity
    and blends it into the AI component.
    """
    keyword_score = compute_keyword_overlap(resume, job)
    experience_score = compute_experience_score(resume, job)

    semantic_score: float = 0.0
    if resume_id and job_id:
        try:
            from app.matching.embedding_service import compute_semantic_similarity

            similarity = await compute_semantic_similarity(resume_id, job_id)
            semantic_score = similarity * 100
        except Exception:
            pass  # Qdrant unavailable — degrade gracefully

    # Blend AI agent score with semantic score for the AI component
    if ai_score is not None and semantic_score > 0:
        blended_ai = (ai_score * 0.7) + (semantic_score * 0.3)
    elif ai_score is not None:
        blended_ai = ai_score
    else:
        blended_ai = semantic_score

    overall = (blended_ai * 0.40) + (keyword_score * 0.35) + (experience_score * 0.25)
    return round(min(overall, 100.0), 1)
