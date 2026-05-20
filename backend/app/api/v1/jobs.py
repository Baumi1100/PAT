# backend/app/api/v1/jobs.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.application import Application
from app.models.user import User
from app.repositories.job_repository import JobRepository
from app.repositories.resume_repository import ResumeRepository
from app.schemas.job import JobCreate, JobRead
from app.services.job_service import JobService
from app.repositories.application_repository import ApplicationRepository

router = APIRouter(prefix="/jobs", tags=["jobs"])


def _svc(session: AsyncSession = Depends(get_db)) -> JobService:  # noqa: B008
    return JobService(JobRepository(session))


@router.post("/", response_model=JobRead, status_code=status.HTTP_201_CREATED)
async def create_job(
    data: JobCreate,
    current_user: User = Depends(get_current_user),  # noqa: B008
    svc: JobService = Depends(_svc),  # noqa: B008
) -> JobRead:
    return await svc.create(current_user.id, data)


@router.get("/", response_model=list[JobRead])
async def list_jobs(
    status_filter: str | None = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),  # noqa: B008
    svc: JobService = Depends(_svc),  # noqa: B008
) -> list[JobRead]:
    return await svc.list_for_user(current_user.id, status=status_filter)


@router.get("/{job_id}", response_model=JobRead)
async def get_job(
    job_id: str,
    current_user: User = Depends(get_current_user),  # noqa: B008
    svc: JobService = Depends(_svc),  # noqa: B008
) -> JobRead:
    return await svc.get_for_user(job_id, current_user.id)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: str,
    current_user: User = Depends(get_current_user),  # noqa: B008
    svc: JobService = Depends(_svc),  # noqa: B008
) -> None:
    await svc.delete(job_id, current_user.id)


@router.post("/{job_id}/analyze", status_code=status.HTTP_202_ACCEPTED)
async def analyze_job(
    job_id: str,
    current_user: User = Depends(get_current_user),  # noqa: B008
    svc: JobService = Depends(_svc),  # noqa: B008
    session: AsyncSession = Depends(get_db),  # noqa: B008
) -> dict:
    from app.tasks.generate_application import generate_application_task

    job = await svc.get_for_user(job_id, current_user.id)

    resume_repo = ResumeRepository(session)
    resume = await resume_repo.get_primary(current_user.id)
    if not resume:
        resumes = await resume_repo.list_by_user(current_user.id)
        resume = resumes[0] if resumes else None
    if not resume:
        raise HTTPException(status_code=400, detail="No resume found. Upload a resume first.")

    app_repo = ApplicationRepository(session)
    existing = await app_repo.get_by_job_and_resume(job_id, resume.id)
    if existing:
        application = existing
    else:
        application = Application(
            user_id=current_user.id,
            job_id=job_id,
            resume_id=resume.id,
            status="pending",
        )
        session.add(application)
        await session.flush()
        await session.refresh(application)

    task = generate_application_task.delay(
        application_id=application.id,
        job_text=job.raw_text or job.title,
        resume_text=resume.raw_text or "",
        applicant_name=current_user.full_name,
    )
    application.celery_task_id = task.id
    application.status = "pending"
    await session.flush()

    return {"application_id": application.id, "task_id": task.id}
