# backend/app/api/v1/applications.py
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.application import Application
from app.models.user import User
from app.repositories.application_repository import ApplicationRepository
from app.schemas.application import ApplicationCreate, ApplicationDetail, ApplicationRead
from app.services.application_service import ApplicationService

router = APIRouter(prefix="/applications", tags=["applications"])


def _svc(session: AsyncSession = Depends(get_db)) -> ApplicationService:  # noqa: B008
    return ApplicationService(ApplicationRepository(session))


@router.post("/", response_model=ApplicationRead, status_code=status.HTTP_201_CREATED)
async def create_application(
    data: ApplicationCreate,
    current_user: User = Depends(get_current_user),  # noqa: B008
    svc: ApplicationService = Depends(_svc),  # noqa: B008
) -> Application:
    return await svc.create(current_user.id, data)


@router.get("/", response_model=list[ApplicationRead])
async def list_applications(
    current_user: User = Depends(get_current_user),  # noqa: B008
    svc: ApplicationService = Depends(_svc),  # noqa: B008
) -> list[Application]:
    return await svc.list_for_user(current_user.id)


@router.get("/{application_id}", response_model=ApplicationDetail)
async def get_application(
    application_id: str,
    current_user: User = Depends(get_current_user),  # noqa: B008
    svc: ApplicationService = Depends(_svc),  # noqa: B008
) -> ApplicationDetail:
    return await svc.get_detail(application_id, current_user.id)


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    application_id: str,
    current_user: User = Depends(get_current_user),  # noqa: B008
    svc: ApplicationService = Depends(_svc),  # noqa: B008
) -> None:
    await svc.delete(application_id, current_user.id)
