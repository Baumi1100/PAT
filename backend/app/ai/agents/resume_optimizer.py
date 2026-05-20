# backend/app/ai/agents/resume_optimizer.py
import json

from app.ai.agents.base_agent import BaseAgent
from app.ai.schemas.document_schemas import ATSKeywordAnalysis, OptimizedResume
from app.ai.schemas.job_schemas import ParsedJob
from app.ai.schemas.resume_schemas import ParsedResume


class ResumeOptimizerAgent(BaseAgent):
    task_type = "resume_optimization"
    system_prompt = (
        "You are an ATS optimization specialist. Your job is to adapt a resume for a specific "
        "job posting — WITHOUT inventing, embellishing, or adding anything that is not already "
        "in the candidate's original resume or personal profile.\n\n"
        "Strict rules:\n"
        "1. NEVER fabricate achievements, metrics, technologies, or responsibilities. "
        "If a number or result is not in the source material, do not add one.\n"
        "2. Keep existing bullet points as close to the original wording as possible. "
        "You may rephrase for clarity, but must not change the substance.\n"
        "3. ATS keyword injection: where a missing high-priority keyword matches something "
        "the candidate actually did, you may add it naturally to an existing bullet. "
        "Do not create new bullets to house keywords.\n"
        "4. The summary must be grounded in the candidate's actual background. "
        "You may emphasize the most relevant real experience for this role.\n"
        "5. Skills section: list only skills that appear in the resume or personal profile. "
        "Reorder so job-relevant skills come first.\n"
        "6. If the personal profile provides context that contradicts or clarifies the parsed "
        "resume, trust the personal profile — it is the candidate's own words.\n"
        "Leave the `latex_source` field empty — it is populated separately by the system."
    )

    async def optimize(
        self,
        resume: ParsedResume,
        job: ParsedJob,
        ats_analysis: ATSKeywordAnalysis,
        original_resume_text: str = "",
        profile_text: str = "",
        user_provider: str | None = None,
        user_model: str | None = None,
    ) -> OptimizedResume:
        context_parts = []

        if profile_text:
            context_parts.append(
                "=== PERSONAL PROFILE (candidate's own words — trust this) ===\n" + profile_text
            )

        if original_resume_text:
            context_parts.append(
                "=== ORIGINAL RESUME TEXT (source of truth) ===\n" + original_resume_text[:6000]
            )

        context_parts.append(
            f"=== PARSED RESUME STRUCTURE ===\n"
            f"Summary: {resume.summary}\n"
            f"Work Experience:\n"
            f"{json.dumps([e.model_dump() for e in resume.work_experience], indent=2)}"
        )

        context_parts.append(
            f"=== TARGET JOB ===\n"
            f"Title: {job.title} at {job.company}\n"
            f"Must-have skills: {job.must_have_skills}\n"
            f"ATS keywords missing from resume: {ats_analysis.keywords_missing_from_resume}\n"
            f"Keywords already present: {ats_analysis.keywords_present_in_resume}"
        )

        message = "\n\n".join(context_parts) + (
            "\n\nAdapt the resume for this job. Stay strictly within the source material."
        )

        return await self._call(
            user_message=message,
            output_schema=OptimizedResume,
            user_provider=user_provider,
            user_model=user_model,
            max_tokens=8192,
        )
