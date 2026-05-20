# backend/app/api/v1/jobs.py
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.repositories.job_repository import JobRepository
from app.schemas.job import JobCreate, JobRead
from app.services.job_service import JobService

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
