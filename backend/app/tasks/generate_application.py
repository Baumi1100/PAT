# backend/app/tasks/generate_application.py
import asyncio
import json

from app.ai.agents.ats_keyword import ATSKeywordAgent
from app.ai.agents.cover_letter import CoverLetterAgent
from app.ai.agents.interview_questions import InterviewQuestionsAgent
from app.ai.agents.job_analyzer import JobAnalyzerAgent
from app.ai.agents.match_scorer import MatchScorerAgent
from app.ai.agents.resume_optimizer import ResumeOptimizerAgent
from app.ai.agents.resume_parser import ResumeParserAgent
from app.ai.agents.skill_gap import SkillGapAgent
from app.tasks.celery_app import celery_app


@celery_app.task(bind=True, name="tasks.generate_application")
def generate_application_task(
    self,
    application_id: str,
    job_text: str,
    resume_text: str,
    applicant_name: str,
    user_provider: str | None = None,
    user_model: str | None = None,
) -> dict:
    return asyncio.run(
        _run_pipeline(
            application_id,
            job_text,
            resume_text,
            applicant_name,
            user_provider,
            user_model,
        )
    )


async def _run_pipeline(
    application_id: str,
    job_text: str,
    resume_text: str,
    applicant_name: str,
    user_provider: str | None,
    user_model: str | None,
) -> dict:
    kw: dict[str, str | None] = {"user_provider": user_provider, "user_model": user_model}

    resume = await ResumeParserAgent().parse(resume_text, **kw)
    job = await JobAnalyzerAgent().analyze(job_text, **kw)
    ats = await ATSKeywordAgent().analyze(resume, job, **kw)
    match = await MatchScorerAgent().score(resume, job, **kw)
    optimized = await ResumeOptimizerAgent().optimize(resume, job, ats, **kw)
    cover = await CoverLetterAgent().generate(resume, job, applicant_name, **kw)
    questions = await InterviewQuestionsAgent().generate(resume, job, match, **kw)
    gaps = await SkillGapAgent().analyze(resume, job, ats, **kw)

    return {
        "application_id": application_id,
        "match_score": match.overall_score,
        "strengths": match.strengths,
        "weaknesses": match.weaknesses,
        "skill_gaps": gaps.critical_gaps,
        "suggestions": gaps.suggestions,
        "optimized_resume": optimized.model_dump_json(),
        "cover_letter": cover.full_text,
        "interview_questions": json.dumps(
            questions.technical_questions + questions.behavioral_questions
        ),
    }
