# backend/app/services/job_service.py
import re
from datetime import UTC, datetime

from sqlalchemy import select

from app.core.exceptions import AuthorizationError, NotFoundError
from app.models.application import Application
from app.models.job import Job
from app.repositories.job_repository import JobRepository
from app.schemas.job import JobCreate, JobUpdate

_DEFAULT_TITLES = {"Job from Telegram", "Job from API", ""}

_PLATFORM_PATTERNS: list[tuple[str, str]] = [
    (r"linkedin\.com", "LinkedIn"),
    (r"stepstone\.de", "Stepstone"),
    (r"indeed\.com", "Indeed"),
    (r"xing\.com", "Xing"),
    (r"glassdoor\.com", "Glassdoor"),
    (r"arbeitsagentur\.de", "Arbeitsagentur"),
    (r"monster\.de", "Monster"),
    (r"karriere\.at", "Karriere.at"),
]


def _detect_platform(url: str | None) -> str | None:
    if not url:
        return None
    for pattern, name in _PLATFORM_PATTERNS:
        if re.search(pattern, url, re.IGNORECASE):
            return name
    return None


def _extract_from_stepstone_url(url: str) -> str | None:
    """Extract job title from Stepstone URL slug like stellenangebote--Title-Slug--12345."""
    match = re.search(r"stellenangebote--(.+?)--\d+", url, re.IGNORECASE)
    if not match:
        return None
    slug = match.group(1)
    title = slug.replace("-", " ").title()
    return title if len(title) >= 5 else None


def _extract_title_from_text(raw_text: str) -> tuple[str | None, str | None]:
    """Heuristic: first substantive line is title, next short line may be company."""
    lines = [ln.strip() for ln in raw_text.splitlines() if ln.strip()]
    title: str | None = None
    company: str | None = None
    for line in lines:
        if 5 <= len(line) <= 150 and title is None:
            title = line
        elif title and len(line) <= 80 and company is None:
            company = line
            break
    return title, company


class JobService:
    def __init__(self, repo: JobRepository) -> None:
        self._repo = repo

    async def create(self, user_id: str, data: JobCreate) -> Job:
        dump = data.model_dump()

        # Auto-detect platform from URL
        if not dump.get("source_platform") and dump.get("url"):
            dump["source_platform"] = _detect_platform(dump["url"])

        # Try to extract a real title if only a placeholder was provided
        if dump.get("title", "") in _DEFAULT_TITLES or not dump.get("title"):
            title: str | None = None
            company: str | None = None

            # 1. Try Stepstone URL slug
            if dump.get("url"):
                title = _extract_from_stepstone_url(dump["url"])

            # 2. Fall back to raw text heuristic
            if not title and dump.get("raw_text"):
                title, company = _extract_title_from_text(dump["raw_text"])

            if title:
                dump["title"] = title
            if company and not dump.get("company"):
                dump["company"] = company

        job = Job(user_id=user_id, **dump)
        return await self._repo.save(job)

    async def update(self, job_id: str, user_id: str, data: JobUpdate) -> Job:
        job = await self.get_for_user(job_id, user_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(job, field, value)
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
        now = datetime.now(UTC)
        job.deleted_at = now
        await self._repo.save(job)

        # Cascade: soft-delete all applications for this job
        result = await self._repo._session.execute(
            select(Application).where(Application.job_id == job_id)
        )
        for app in result.scalars().all():
            app.deleted_at = now
        await self._repo._session.flush()
