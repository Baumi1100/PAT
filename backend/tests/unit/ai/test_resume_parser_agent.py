# backend/tests/unit/ai/test_resume_parser_agent.py
from unittest.mock import AsyncMock, patch

from app.ai.agents.resume_parser import ResumeParserAgent
from app.ai.schemas.resume_schemas import ParsedResume


async def test_parse_resume_returns_parsed_resume():
    agent = ResumeParserAgent()
    mock_output = ParsedResume(
        full_name="Jane Doe",
        email="jane@example.com",
        skills=["Python", "FastAPI"],
        seniority_level="senior",
        years_of_experience=7.0,
    )
    with patch.object(agent, "_call", new=AsyncMock(return_value=mock_output)):
        result = await agent.parse("Jane Doe\nPython developer, 7 years experience")
        assert result.full_name == "Jane Doe"
        assert "Python" in result.skills
        assert result.seniority_level == "senior"
