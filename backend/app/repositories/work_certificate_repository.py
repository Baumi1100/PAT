# backend/app/repositories/work_certificate_repository.py
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.work_certificate import WorkCertificate


class WorkCertificateRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save(self, cert: WorkCertificate) -> WorkCertificate:
        self._session.add(cert)
        await self._session.flush()
        await self._session.refresh(cert)
        return cert

    async def list_by_user(self, user_id: str) -> list[WorkCertificate]:
        result = await self._session.execute(
            select(WorkCertificate)
            .where(
                WorkCertificate.user_id == user_id,
                WorkCertificate.deleted_at.is_(None),
            )
            .order_by(WorkCertificate.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_active_by_id(self, cert_id: str) -> WorkCertificate | None:
        result = await self._session.execute(
            select(WorkCertificate).where(
                WorkCertificate.id == cert_id,
                WorkCertificate.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def soft_delete(self, cert: WorkCertificate) -> None:
        cert.deleted_at = datetime.now(UTC)
        await self._session.flush()
