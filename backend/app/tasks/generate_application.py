import asyncio
import json

# Import all models so SQLAlchemy's mapper registry is fully populated before any session opens.
import app.models.application  # noqa: F401
import app.models.job  # noqa: F401
import app.models.resume  # noqa: F401
import app.models.user  # noqa: F401
from app.models.job import Job

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


def _make_fresh_session():
    """Create a brand-new engine + session bound to the current event loop."""
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
    from app.config import get_settings
    s = get_settings()
    engine = create_async_engine(s.database_url, pool_pre_ping=False)
    factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    return factory


async def _run_pipeline(
    application_id: str,
    job_text: str,
    resume_text: str,
    applicant_name: str,
    user_provider: str | None,
    user_model: str | None,
) -> dict:
    from app.models.application import Application

    session_factory = _make_fresh_session()
    kw: dict[str, str | None] = {"user_provider": user_provider, "user_model": user_model}

    async with session_factory() as session:
        app = await session.get(Application, application_id)
        if app:
            app.status = "analyzing"
            await session.commit()

    try:
        resume = await ResumeParserAgent().parse(resume_text, **kw)
        job = await JobAnalyzerAgent().analyze(job_text, **kw)

        # Back-fill Job record with AI-extracted metadata
        async with session_factory() as session:
            db_app = await session.get(Application, application_id)
            if db_app:
                db_job = await session.get(Job, db_app.job_id)
                if db_job:
                    if job.title and db_job.title in ("Job from Telegram", "Job from API"):
                        db_job.title = job.title
                    if job.company and not db_job.company:
                        db_job.company = job.company
                    if job.location and not db_job.location:
                        db_job.location = job.location
                    await session.commit()

        ats = await ATSKeywordAgent().analyze(resume, job, **kw)
        match = await MatchScorerAgent().score(resume, job, **kw)
        optimized = await ResumeOptimizerAgent().optimize(resume, job, ats, **kw)
        cover = await CoverLetterAgent().generate(resume, job, applicant_name, **kw)
        questions = await InterviewQuestionsAgent().generate(resume, job, match, **kw)
        gaps = await SkillGapAgent().analyze(resume, job, ats, **kw)

        result = {
            "application_id": application_id,
            "match_score": match.overall_score,
            "strengths": match.strengths,
            "weaknesses": match.weaknesses,
            "skill_gaps": gaps.critical_gaps,
            "suggestions": gaps.suggestions,
            "optimized_resume": optimized.model_dump_json(),
            "cover_letter": cover.model_dump_json(),
            "interview_questions": json.dumps(
                questions.technical_questions + questions.behavioral_questions
            ),
        }

        async with session_factory() as session:
            app = await session.get(Application, application_id)
            if app:
                app.status = "complete"
                app.match_score = result["match_score"]
                app.strengths = json.dumps(result["strengths"])
                app.weaknesses = json.dumps(result["weaknesses"])
                app.skill_gaps = json.dumps(result["skill_gaps"])
                app.suggestions = json.dumps(result["suggestions"])
                app.optimized_resume = result["optimized_resume"]
                app.cover_letter = result["cover_letter"]
                app.interview_questions = result["interview_questions"]
                await session.commit()

        return result

    except Exception as exc:
        async with session_factory() as session:
            app = await session.get(Application, application_id)
            if app:
                app.status = "error"
                app.error_message = str(exc)
                await session.commit()
        raise
