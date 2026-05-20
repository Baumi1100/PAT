# backend/app/ai/agents/resume_optimizer.py
import json

from app.ai.agents.base_agent import BaseAgent
from app.ai.schemas.document_schemas import ATSKeywordAnalysis, OptimizedResume
from app.ai.schemas.job_schemas import ParsedJob
from app.ai.schemas.resume_schemas import ParsedResume


class ResumeOptimizerAgent(BaseAgent):
    task_type = "resume_optimization"
    system_prompt = (
        "You are an expert ATS resume writer and career coach. "
        "Rewrite and optimize the candidate's resume for the target job. "
        "Rules:\n"
        "1. Inject missing high-priority ATS keywords naturally — never stuff keywords.\n"
        "2. Rewrite all bullet points in STAR format (Situation, Task, Action, Result) "
        "with quantified achievements where possible.\n"
        "3. The summary must directly address the job requirements.\n"
        "4. Skills section must lead with the job's must-have technologies.\n"
        "5. Keep language active, recruiter-friendly, professional.\n"
        "6. Never fabricate experience or skills the candidate doesn't have.\n"
        "Leave the `latex_source` field empty — it is populated separately by the system."
    )

    async def optimize(
        self,
        resume: ParsedResume,
        job: ParsedJob,
        ats_analysis: ATSKeywordAnalysis,
        user_provider: str | None = None,
        user_model: str | None = None,
    ) -> OptimizedResume:
        message = (
            f"Original Resume Summary: {resume.summary}\n"
            f"Work Experience:\n"
            f"{json.dumps([e.model_dump() for e in resume.work_experience], indent=2)}\n\n"
            f"Target Job Title: {job.title} at {job.company}\n"
            f"Must-have skills: {job.must_have_skills}\n"
            f"ATS keywords missing from resume: {ats_analysis.keywords_missing_from_resume}\n"
            f"Keywords already present: {ats_analysis.keywords_present_in_resume}\n\n"
            "Optimize the resume for this specific job."
        )
        return await self._call(
            user_message=message,
            output_schema=OptimizedResume,
            user_provider=user_provider,
            user_model=user_model,
            max_tokens=8192,
        )
