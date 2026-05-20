# backend/app/services/application_service.py
import json
from datetime import UTC, datetime

from app.core.exceptions import AuthorizationError, ConflictError, NotFoundError
from app.models.application import Application
from app.repositories.application_repository import ApplicationRepository
from app.schemas.application import ApplicationCreate, ApplicationDetail


class ApplicationService:
    def __init__(self, repo: ApplicationRepository) -> None:
        self._repo = repo

    async def create(self, user_id: str, data: ApplicationCreate) -> Application:
        existing = await self._repo.get_by_job_and_resume(data.job_id, data.resume_id)
        if existing:
            raise ConflictError("Application already exists for this job/resume combination")
        application = Application(
            user_id=user_id,
            job_id=data.job_id,
            resume_id=data.resume_id,
            status="pending",
        )
        return await self._repo.save(application)

    async def list_for_user(self, user_id: str) -> list[Application]:
        return await self._repo.list_by_user(user_id)

    async def get_for_user(self, application_id: str, user_id: str) -> Application:
        app = await self._repo.get_by_id(application_id)
        if not app or app.deleted_at is not None:
            raise NotFoundError("Application not found")
        if app.user_id != user_id:
            raise AuthorizationError("Not your application")
        return app

    async def delete(self, application_id: str, user_id: str) -> None:
        app = await self.get_for_user(application_id, user_id)
        app.deleted_at = datetime.now(UTC)
        await self._repo.save(app)

    async def get_detail(self, application_id: str, user_id: str) -> ApplicationDetail:
        app = await self.get_for_user(application_id, user_id)
        return ApplicationDetail(
            id=app.id,
            user_id=app.user_id,
            job_id=app.job_id,
            resume_id=app.resume_id,
            match_score=app.match_score,
            status=app.status,
            celery_task_id=app.celery_task_id,
            created_at=app.created_at,
            strengths=json.loads(app.strengths) if app.strengths else None,
            weaknesses=json.loads(app.weaknesses) if app.weaknesses else None,
            skill_gaps=json.loads(app.skill_gaps) if app.skill_gaps else None,
            suggestions=json.loads(app.suggestions) if app.suggestions else None,
            cover_letter=app.cover_letter,
            interview_questions=(
                json.loads(app.interview_questions) if app.interview_questions else None
            ),
        )
