# backend/app/services/job_service.py
from datetime import UTC, datetime

from app.core.exceptions import AuthorizationError, NotFoundError
from app.models.job import Job
from app.repositories.job_repository import JobRepository
from app.schemas.job import JobCreate


class JobService:
    def __init__(self, repo: JobRepository) -> None:
        self._repo = repo

    async def create(self, user_id: str, data: JobCreate) -> Job:
        job = Job(user_id=user_id, **data.model_dump())
        return await self._repo.save(job)

    async def list_for_user(self, user_id: str, status: str | None = None) -> list[Job]:
        return await self._repo.list_by_user(user_id, status=status)

    async def get_for_user(self, job_id: str, user_id: str) -> Job:
        job = await self._repo.get_active_by_id(job_id)
        if not job:
            raise NotFoundError("Job not found")
        if job.user_id != user_id:
            raise AuthorizationError("Not your job")
        return job

    async def delete(self, job_id: str, user_id: str) -> None:
        job = await self.get_for_user(job_id, user_id)
        job.deleted_at = datetime.now(UTC)
        await self._repo.save(job)
