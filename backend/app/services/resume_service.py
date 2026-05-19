# backend/app/services/resume_service.py
from datetime import UTC, datetime

from app.core.exceptions import AuthorizationError, NotFoundError
from app.models.resume import Resume
from app.repositories.resume_repository import ResumeRepository
from app.schemas.resume import ResumeCreate, ResumeUpdate


class ResumeService:
    def __init__(self, repo: ResumeRepository) -> None:
        self._repo = repo

    async def create(self, user_id: str, data: ResumeCreate) -> Resume:
        resume = Resume(user_id=user_id, **data.model_dump())
        if data.is_primary:
            await self._unset_primary(user_id)
        return await self._repo.save(resume)

    async def list_for_user(self, user_id: str) -> list[Resume]:
        return await self._repo.list_by_user(user_id)

    async def get_for_user(self, resume_id: str, user_id: str) -> Resume:
        resume = await self._repo.get_active_by_id(resume_id)
        if not resume:
            raise NotFoundError("Resume not found")
        if resume.user_id != user_id:
            raise AuthorizationError("Not your resume")
        return resume

    async def update(self, resume_id: str, user_id: str, data: ResumeUpdate) -> Resume:
        resume = await self.get_for_user(resume_id, user_id)
        if data.title is not None:
            resume.title = data.title
        if data.is_primary is not None:
            if data.is_primary:
                await self._unset_primary(user_id)
            resume.is_primary = data.is_primary
        return await self._repo.save(resume)

    async def delete(self, resume_id: str, user_id: str) -> None:
        resume = await self.get_for_user(resume_id, user_id)
        resume.deleted_at = datetime.now(UTC)
        await self._repo.save(resume)

    async def _unset_primary(self, user_id: str) -> None:
        existing = await self._repo.get_primary(user_id)
        if existing:
            existing.is_primary = False
            await self._repo.save(existing)
