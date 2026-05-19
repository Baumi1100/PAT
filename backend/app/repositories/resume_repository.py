# backend/app/repositories/resume_repository.py
from sqlalchemy import select

from app.models.resume import Resume
from app.repositories.base import BaseRepository


class ResumeRepository(BaseRepository[Resume]):
    model = Resume

    async def list_by_user(self, user_id: str) -> list[Resume]:
        result = await self._session.execute(
            select(Resume)
            .where(Resume.user_id == user_id, Resume.deleted_at.is_(None))
            .order_by(Resume.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_primary(self, user_id: str) -> Resume | None:
        result = await self._session.execute(
            select(Resume).where(
                Resume.user_id == user_id,
                Resume.is_primary.is_(True),
                Resume.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()
