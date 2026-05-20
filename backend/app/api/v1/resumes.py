# backend/app/api/v1/resumes.py
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.resume import Resume
from app.models.user import User
from app.repositories.resume_repository import ResumeRepository
from app.schemas.resume import ResumeCreate, ResumeRead, ResumeUpdate
from app.services.resume_service import ResumeService

router = APIRouter(prefix="/resumes", tags=["resumes"])


def _svc(session: AsyncSession = Depends(get_db)) -> ResumeService:  # noqa: B008
    return ResumeService(ResumeRepository(session))


@router.post("/", response_model=ResumeRead, status_code=status.HTTP_201_CREATED)
async def create_resume(
    data: ResumeCreate,
    current_user: User = Depends(get_current_user),  # noqa: B008
    svc: ResumeService = Depends(_svc),  # noqa: B008
) -> Resume:
    return await svc.create(current_user.id, data)


@router.get("/", response_model=list[ResumeRead])
async def list_resumes(
    current_user: User = Depends(get_current_user),  # noqa: B008
    svc: ResumeService = Depends(_svc),  # noqa: B008
) -> list[Resume]:
    return await svc.list_for_user(current_user.id)


@router.get("/{resume_id}", response_model=ResumeRead)
async def get_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),  # noqa: B008
    svc: ResumeService = Depends(_svc),  # noqa: B008
) -> Resume:
    return await svc.get_for_user(resume_id, current_user.id)


@router.patch("/{resume_id}", response_model=ResumeRead)
async def update_resume(
    resume_id: str,
    data: ResumeUpdate,
    current_user: User = Depends(get_current_user),  # noqa: B008
    svc: ResumeService = Depends(_svc),  # noqa: B008
) -> Resume:
    return await svc.update(resume_id, current_user.id, data)


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),  # noqa: B008
    svc: ResumeService = Depends(_svc),  # noqa: B008
) -> None:
    await svc.delete(resume_id, current_user.id)
