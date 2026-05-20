# backend/tests/unit/ai/test_match_scorer_agent.py
from unittest.mock import AsyncMock, patch

from app.ai.agents.match_scorer import MatchScorerAgent
from app.ai.schemas.job_schemas import ParsedJob
from app.ai.schemas.match_schemas import MatchResult
from app.ai.schemas.resume_schemas import ParsedResume


async def test_score_returns_match_result():
    agent = MatchScorerAgent()
    mock_result = MatchResult(
        overall_score=82.5,
        skill_score=90.0,
        experience_score=75.0,
        keyword_score=80.0,
        seniority_match=True,
        strengths=["Strong Python skills"],
        weaknesses=["Missing Kubernetes experience"],
        summary="Strong candidate.",
    )
    resume = ParsedResume(skills=["Python", "FastAPI"], seniority_level="senior")
    job = ParsedJob(must_have_skills=["Python", "Kubernetes"], seniority_level="senior")

    with patch.object(agent, "_call", new=AsyncMock(return_value=mock_result)):
        result = await agent.score(resume, job)
        assert result.overall_score == 82.5
        assert result.seniority_match is True
