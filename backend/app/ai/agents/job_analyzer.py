# backend/app/ai/agents/job_analyzer.py
from app.ai.agents.base_agent import BaseAgent
from app.ai.schemas.job_schemas import ParsedJob


class JobAnalyzerAgent(BaseAgent):
    task_type = "job_analysis"
    system_prompt = (
        "You are an expert job posting analyzer for a recruiting platform. "
        "Extract all structured requirements from the job posting. "
        "Separate must-have from nice-to-have requirements rigorously. "
        "Extract ATS keywords — these are exact phrases that ATS systems scan for. "
        "For seniority_level use: junior | mid | senior | lead | principal | executive. "
        "Normalize technology names."
    )

    async def analyze(
        self,
        job_text: str,
        user_provider: str | None = None,
        user_model: str | None = None,
    ) -> ParsedJob:
        return await self._call(
            user_message=f"Analyze this job posting:\n\n{job_text}",
            output_schema=ParsedJob,
            user_provider=user_provider,
            user_model=user_model,
        )
