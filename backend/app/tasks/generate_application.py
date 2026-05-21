import asyncio
import json

# Import all models so SQLAlchemy's mapper registry is fully populated before any session opens.
import app.models.application  # noqa: F401
import app.models.job  # noqa: F401
import app.models.resume  # noqa: F401
import app.models.user  # noqa: F401
import app.models.work_certificate  # noqa: F401
from app.ai.agents.ats_keyword import ATSKeywordAgent
from app.ai.agents.certificate_parser import CertificateParserAgent
from app.ai.agents.cover_letter import CoverLetterAgent
from app.ai.agents.interview_questions import InterviewQuestionsAgent
from app.ai.agents.job_analyzer import JobAnalyzerAgent
from app.ai.agents.match_scorer import MatchScorerAgent
from app.ai.agents.resume_optimizer import ResumeOptimizerAgent
from app.ai.agents.resume_parser import ResumeParserAgent
from app.ai.agents.skill_gap import SkillGapAgent
from app.ai.schemas.resume_schemas import WorkExperience
from app.document_processing.moderncv_builder import build_cover_letter, build_resume
from app.models.job import Job
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

        # Enrich resume with data from uploaded Arbeitszeugnisse
        async with session_factory() as session:
            db_app = await session.get(Application, application_id)
            if db_app:
                from sqlalchemy import select

                from app.models.work_certificate import WorkCertificate

                result = await session.execute(
                    select(WorkCertificate).where(
                        WorkCertificate.user_id == db_app.user_id,
                        WorkCertificate.deleted_at.is_(None),
                    )
                )
                certs = list(result.scalars().all())
                for cert in certs:
                    if not cert.raw_text:
                        continue
                    parsed_cert = await CertificateParserAgent().parse(cert.raw_text, **kw)
                    # Merge into resume: add or enrich matching work experience entry
                    matched = next(
                        (
                            e
                            for e in resume.work_experience
                            if parsed_cert.company
                            and parsed_cert.company.lower() in e.company.lower()
                        ),
                        None,
                    )
                    if matched:
                        matched.achievements += [
                            a for a in parsed_cert.achievements if a not in matched.achievements
                        ]
                        matched.responsibilities += [
                            r
                            for r in parsed_cert.responsibilities
                            if r not in matched.responsibilities
                        ]
                        if parsed_cert.technologies:
                            matched.technologies = list(
                                set(matched.technologies + parsed_cert.technologies)
                            )
                    else:
                        # Certificate covers a role not yet in the parsed resume — add it
                        if parsed_cert.company and parsed_cert.title:
                            resume.work_experience.append(
                                WorkExperience(
                                    company=parsed_cert.company,
                                    title=parsed_cert.title,
                                    start_date=parsed_cert.start_date or "",
                                    end_date=parsed_cert.end_date,
                                    responsibilities=parsed_cert.responsibilities,
                                    achievements=parsed_cert.achievements,
                                    technologies=parsed_cert.technologies,
                                )
                            )
                    # Surface soft skills and leadership from certificate
                    resume.soft_skills = list(set(resume.soft_skills + parsed_cert.soft_skills))
                    if parsed_cert.leadership_indicators and not resume.has_leadership:
                        resume.has_leadership = True

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
                    if (
                        hasattr(job, "salary_range")
                        and job.salary_range
                        and not db_job.salary_range
                    ):
                        db_job.salary_range = job.salary_range
                    if (
                        hasattr(job, "remote_policy")
                        and job.remote_policy
                        and not db_job.remote_policy
                    ):
                        db_job.remote_policy = job.remote_policy
                    if (
                        hasattr(job, "employment_type")
                        and job.employment_type
                        and not db_job.employment_type
                    ):
                        db_job.employment_type = job.employment_type
                    if (
                        hasattr(job, "seniority_level")
                        and job.seniority_level
                        and not db_job.seniority_level
                    ):
                        db_job.seniority_level = job.seniority_level
                    await session.commit()

        # Fetch profile_text for this user
        profile_text = ""
        async with session_factory() as session:
            db_app = await session.get(Application, application_id)
            if db_app:
                from app.models.user import User as UserModel

                user_obj = await session.get(UserModel, db_app.user_id)
                if user_obj and user_obj.profile_text:
                    profile_text = user_obj.profile_text

        ats = await ATSKeywordAgent().analyze(resume, job, **kw)
        match = await MatchScorerAgent().score(resume, job, **kw)
        optimized = await ResumeOptimizerAgent().optimize(
            resume,
            job,
            ats,
            original_resume_text=resume_text,
            profile_text=profile_text,
            **kw,
        )
        cover = await CoverLetterAgent().generate(
            resume, job, applicant_name, profile_text=profile_text, **kw
        )

        # Build moderncv LaTeX — our template is always valid, no AI-generated LaTeX needed
        optimized.latex_source = build_resume(resume, optimized)
        cover.latex_source = build_cover_letter(resume, cover, job)

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

        # ── Telegram notification ──────────────────────────────────────────
        # Fetch user telegram_chat_id and job metadata, then notify.
        # Wrapped in its own block so any failure never affects the result.
        try:
            from app.config import get_settings
            from app.integrations.telegram.notify import send_analysis_result
            from app.models.user import User as UserModel

            async with session_factory() as session:
                db_app = await session.get(Application, application_id)
                if db_app:
                    user_obj = await session.get(UserModel, db_app.user_id)
                    db_job = await session.get(Job, db_app.job_id)
                    if user_obj and user_obj.telegram_chat_id:
                        await send_analysis_result(
                            telegram_chat_id=user_obj.telegram_chat_id,
                            job_title=db_job.title if db_job else "Stelle",
                            company=db_job.company if db_job else None,
                            match_score=result["match_score"],
                            strengths=result["strengths"],
                            skill_gaps=result["skill_gaps"],
                            application_id=application_id,
                            frontend_url=get_settings().frontend_url,
                        )
        except Exception:
            import logging
            logging.getLogger(__name__).exception(
                "Telegram notification setup failed for application %s", application_id
            )

        return result

    except Exception as exc:
        async with session_factory() as session:
            app = await session.get(Application, application_id)
            if app:
                app.status = "error"
                app.error_message = str(exc)
                await session.commit()
        raise
