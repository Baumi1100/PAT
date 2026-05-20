# backend/app/repositories/application_repository.py
from sqlalchemy import select

from app.models.application import Application
from app.repositories.base import BaseRepository


class ApplicationRepository(BaseRepository[Application]):
    model = Application

    async def list_by_user(self, user_id: str) -> list[Application]:
        result = await self._session.execute(
            select(Application)
            .where(Application.user_id == user_id, Application.deleted_at.is_(None))
            .order_by(Application.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_job_and_resume(self, job_id: str, resume_id: str) -> Application | None:
        result = await self._session.execute(
            select(Application).where(
                Application.job_id == job_id,
                Application.resume_id == resume_id,
                Application.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()
