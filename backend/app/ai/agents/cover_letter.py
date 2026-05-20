# backend/app/ai/agents/cover_letter.py
from app.ai.agents.base_agent import BaseAgent
from app.ai.schemas.document_schemas import CoverLetter
from app.ai.schemas.job_schemas import ParsedJob
from app.ai.schemas.resume_schemas import ParsedResume


class CoverLetterAgent(BaseAgent):
    task_type = "cover_letter"
    system_prompt = (
        "You are an expert cover letter writer for senior technical and leadership roles. "
        "Write a compelling, personalized cover letter that:\n"
        "1. Opens with a specific hook referencing the company or role.\n"
        "2. Demonstrates genuine motivation for the company/role — not generic phrases.\n"
        "3. Highlights 2-3 most relevant achievements from the candidate's experience "
        "with specific metrics where available.\n"
        "4. Addresses the key technical competencies the job requires.\n"
        "5. If leadership is required, emphasizes leadership experience.\n"
        "6. Closes with a confident call to action.\n"
        "Tone: professional, confident, specific. "
        "Avoid clichés like 'passionate' or 'hardworking'. "
        "Length: 3-4 paragraphs. Also provide full_text as a single formatted string.\n"
        "Leave the `latex_source` field empty — it is populated separately by the system."
    )

    async def generate(
        self,
        resume: ParsedResume,
        job: ParsedJob,
        applicant_name: str,
        user_provider: str | None = None,
        user_model: str | None = None,
    ) -> CoverLetter:
        message = (
            f"Applicant: {applicant_name}\n"
            f"Applying for: {job.title} at {job.company or 'the company'}\n"
            f"Job description summary: {job.company_description}\n"
            f"Key requirements: {job.must_have_skills[:10]}\n"
            f"Requires leadership: {job.requires_leadership}\n\n"
            f"Candidate summary: {resume.summary}\n"
            f"Top skills: {(resume.skills + resume.technologies)[:15]}\n"
            f"Years experience: {resume.years_of_experience}\n"
            f"Seniority: {resume.seniority_level}\n"
            f"Has leadership experience: {resume.has_leadership}\n"
            f"Recent roles: {[f'{e.title} at {e.company}' for e in resume.work_experience[:3]]}"
        )
        return await self._call(
            user_message=message,
            output_schema=CoverLetter,
            user_provider=user_provider,
            user_model=user_model,
            max_tokens=2048,
        )
