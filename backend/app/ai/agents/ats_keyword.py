# backend/app/ai/agents/ats_keyword.py
import json

from app.ai.agents.base_agent import BaseAgent
from app.ai.schemas.document_schemas import ATSKeywordAnalysis
from app.ai.schemas.job_schemas import ParsedJob
from app.ai.schemas.resume_schemas import ParsedResume


class ATSKeywordAgent(BaseAgent):
    task_type = "ats_keywords"
    system_prompt = (
        "You are an ATS (Applicant Tracking System) keyword optimization expert. "
        "Given a parsed resume and a parsed job posting, identify which high-priority ATS "
        "keywords appear in the resume and which are missing. "
        "High priority = must-have skills and technologies. "
        "Medium priority = nice-to-have and common industry terms. "
        "Calculate a keyword density score from 0-100 based on coverage of high-priority keywords."
    )

    async def analyze(
        self,
        resume: ParsedResume,
        job: ParsedJob,
        user_provider: str | None = None,
        user_model: str | None = None,
    ) -> ATSKeywordAnalysis:
        message = (
            f"Resume skills and technologies:\n"
            f"{json.dumps(resume.skills + resume.technologies)}\n\n"
            f"Job must-have skills: {json.dumps(job.must_have_skills)}\n"
            f"Job nice-to-have: {json.dumps(job.nice_to_have_skills)}\n"
            f"Job ATS keywords: {json.dumps(job.ats_keywords)}\n"
            f"Job technologies: {json.dumps(job.technologies)}"
        )
        return await self._call(
            user_message=message,
            output_schema=ATSKeywordAnalysis,
            user_provider=user_provider,
            user_model=user_model,
        )
