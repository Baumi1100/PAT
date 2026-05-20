# backend/app/ai/agents/resume_parser.py
from app.ai.agents.base_agent import BaseAgent
from app.ai.schemas.resume_schemas import ParsedResume


class ResumeParserAgent(BaseAgent):
    task_type = "resume_parsing"
    system_prompt = (
        "You are an expert resume parser for a recruiting platform. "
        "Extract all structured information from the resume text provided. "
        "Be thorough: capture all skills, technologies, work history, education, "
        "certifications, and infer seniority level and years of experience. "
        "For seniority_level use: junior | mid | senior | lead | principal | executive. "
        "Normalize technology names (e.g. 'JS' → 'JavaScript', 'k8s' → 'Kubernetes')."
    )

    async def parse(
        self,
        resume_text: str,
        user_provider: str | None = None,
        user_model: str | None = None,
    ) -> ParsedResume:
        return await self._call(
            user_message=f"Parse this resume:\n\n{resume_text}",
            output_schema=ParsedResume,
            user_provider=user_provider,
            user_model=user_model,
        )
