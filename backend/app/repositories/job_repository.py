# backend/app/repositories/job_repository.py
from sqlalchemy import select

from app.models.job import Job
from app.repositories.base import BaseRepository


class JobRepository(BaseRepository[Job]):
    model = Job

    async def list_by_user(self, user_id: str, status: str | None = None) -> list[Job]:
        stmt = select(Job).where(Job.user_id == user_id, Job.deleted_at.is_(None))
        if status:
            stmt = stmt.where(Job.status == status)
        stmt = stmt.order_by(Job.created_at.desc())
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def get_active_by_id(self, job_id: str) -> Job | None:
        result = await self._session.execute(
            select(Job).where(Job.id == job_id, Job.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()
