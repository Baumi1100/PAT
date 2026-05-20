# backend/app/ai/agents/cover_letter.py
from app.ai.agents.base_agent import BaseAgent
from app.ai.schemas.document_schemas import CoverLetter
from app.ai.schemas.job_schemas import ParsedJob
from app.ai.schemas.resume_schemas import ParsedResume


class CoverLetterAgent(BaseAgent):
    task_type = "cover_letter"
    system_prompt = (
        "You are an expert cover letter writer. Write a compelling cover letter that is "
        "truthful and grounded in the candidate's actual experience.\n\n"
        "Strict rules:\n"
        "1. NEVER invent achievements, projects, or skills not present in the source material.\n"
        "2. If a personal profile is provided, treat it as the candidate's own voice — "
        "mirror their tone and use their specific examples.\n"
        "3. Highlight 2-3 genuinely relevant achievements from the candidate's real background.\n"
        "4. Open with a specific hook referencing the company or role.\n"
        "5. Address the key requirements of the job using the candidate's real experience.\n"
        "6. If leadership is required and the candidate has real evidence of it, mention it. "
        "If not, do not claim it.\n"
        "7. Tone: professional, confident, specific. Avoid clichés.\n"
        "8. Length: 3-4 paragraphs. Provide full_text as a single formatted string.\n"
        "Leave the `latex_source` field empty — it is populated separately by the system."
    )

    async def generate(
        self,
        resume: ParsedResume,
        job: ParsedJob,
        applicant_name: str,
        profile_text: str = "",
        user_provider: str | None = None,
        user_model: str | None = None,
    ) -> CoverLetter:
        context_parts = [f"Applicant: {applicant_name}"]

        if profile_text:
            context_parts.append(
                "=== PERSONAL PROFILE (candidate's own words — primary source) ===\n" + profile_text
            )

        context_parts.append(
            f"=== CANDIDATE BACKGROUND ===\n"
            f"Summary: {resume.summary}\n"
            f"Top skills: {(resume.skills + resume.technologies)[:15]}\n"
            f"Years experience: {resume.years_of_experience}\n"
            f"Seniority: {resume.seniority_level}\n"
            f"Has leadership experience: {resume.has_leadership}\n"
            f"Recent roles: {[f'{e.title} at {e.company}' for e in resume.work_experience[:3]]}"
        )

        context_parts.append(
            f"=== TARGET JOB ===\n"
            f"Role: {job.title} at {job.company or 'the company'}\n"
            f"Company description: {job.company_description}\n"
            f"Key requirements: {job.must_have_skills[:10]}\n"
            f"Requires leadership: {job.requires_leadership}"
        )

        message = "\n\n".join(context_parts)

        return await self._call(
            user_message=message,
            output_schema=CoverLetter,
            user_provider=user_provider,
            user_model=user_model,
            max_tokens=2048,
        )
