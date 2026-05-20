# backend/app/api/v1/certificates.py
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthorizationError, NotFoundError
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.work_certificate import WorkCertificate
from app.repositories.work_certificate_repository import WorkCertificateRepository
from app.schemas.work_certificate import WorkCertificateRead

router = APIRouter(prefix="/certificates", tags=["certificates"])


def _repo(session: AsyncSession = Depends(get_db)) -> WorkCertificateRepository:  # noqa: B008
    return WorkCertificateRepository(session)


@router.get("/", response_model=list[WorkCertificateRead])
async def list_certificates(
    current_user: User = Depends(get_current_user),  # noqa: B008
    repo: WorkCertificateRepository = Depends(_repo),  # noqa: B008
) -> list[WorkCertificate]:
    return await repo.list_by_user(current_user.id)


@router.delete("/{certificate_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_certificate(
    certificate_id: str,
    current_user: User = Depends(get_current_user),  # noqa: B008
    repo: WorkCertificateRepository = Depends(_repo),  # noqa: B008
) -> None:
    cert = await repo.get_active_by_id(certificate_id)
    if not cert:
        raise NotFoundError("Certificate not found").to_http()
    if cert.user_id != current_user.id:
        raise AuthorizationError("Not your certificate").to_http()
    await repo.soft_delete(cert)
