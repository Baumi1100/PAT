# backend/app/ai/agents/match_scorer.py
from app.ai.agents.base_agent import BaseAgent
from app.ai.schemas.job_schemas import ParsedJob
from app.ai.schemas.match_schemas import MatchResult
from app.ai.schemas.resume_schemas import ParsedResume


class MatchScorerAgent(BaseAgent):
    task_type = "match_scoring"
    system_prompt = (
        "You are an expert recruiter and technical hiring manager scoring a candidate's fit "
        "for a job. Score from 0-100 for each dimension: skill_score (technical skills match), "
        "experience_score (years and relevance of experience), "
        "keyword_score (ATS keyword coverage). "
        "overall_score is the weighted average: skill 40%, experience 35%, keyword 25%. "
        "Be objective. List specific strengths and weaknesses. "
        "seniority_match is true only if candidate level matches or exceeds job requirement."
    )

    async def score(
        self,
        resume: ParsedResume,
        job: ParsedJob,
        user_provider: str | None = None,
        user_model: str | None = None,
    ) -> MatchResult:
        message = (
            f"Candidate:\n"
            f"- Skills: {resume.skills}\n"
            f"- Technologies: {resume.technologies}\n"
            f"- Years experience: {resume.years_of_experience}\n"
            f"- Seniority: {resume.seniority_level}\n"
            f"- Industries: {resume.industries}\n\n"
            f"Job:\n"
            f"- Must-have: {job.must_have_skills}\n"
            f"- Nice-to-have: {job.nice_to_have_skills}\n"
            f"- Technologies: {job.technologies}\n"
            f"- Min years: {job.min_years_experience}\n"
            f"- Required seniority: {job.seniority_level}\n"
            f"- Requires leadership: {job.requires_leadership}"
        )
        return await self._call(
            user_message=message,
            output_schema=MatchResult,
            user_provider=user_provider,
            user_model=user_model,
        )
