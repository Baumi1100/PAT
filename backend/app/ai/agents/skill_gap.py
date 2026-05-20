# backend/app/ai/agents/skill_gap.py
from app.ai.agents.base_agent import BaseAgent
from app.ai.schemas.document_schemas import ATSKeywordAnalysis
from app.ai.schemas.job_schemas import ParsedJob
from app.ai.schemas.match_schemas import SkillGapReport
from app.ai.schemas.resume_schemas import ParsedResume


class SkillGapAgent(BaseAgent):
    task_type = "skill_gap"
    system_prompt = (
        "You are a career development advisor analyzing a candidate's skill gaps "
        "for a target role. "
        "critical_gaps: must-have skills the candidate is missing (prioritized). "
        "optional_gaps: nice-to-have skills missing. "
        "suggestions: specific, actionable steps to close the gaps "
        "(e.g. 'Complete the AWS Solutions Architect Associate certification — takes ~3 months'). "
        "learning_resources: specific courses, certifications, or projects. "
        "estimated_gap_closure_weeks: realistic estimate if candidate studies part-time."
    )

    async def analyze(
        self,
        resume: ParsedResume,
        job: ParsedJob,
        ats_analysis: ATSKeywordAnalysis,
        user_provider: str | None = None,
        user_model: str | None = None,
    ) -> SkillGapReport:
        message = (
            f"Candidate skills: {resume.skills + resume.technologies}\n"
            f"Candidate certifications: {[c.name for c in resume.certifications]}\n"
            f"Job must-have: {job.must_have_skills}\n"
            f"Job nice-to-have: {job.nice_to_have_skills}\n"
            f"Missing high-priority keywords: {ats_analysis.keywords_missing_from_resume}"
        )
        return await self._call(
            user_message=message,
            output_schema=SkillGapReport,
            user_provider=user_provider,
            user_model=user_model,
        )
