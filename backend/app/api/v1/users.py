# backend/app/api/v1/users.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)) -> User:  # noqa: B008
    return current_user


@router.patch("/me", response_model=UserRead)
async def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),  # noqa: B008
    session: AsyncSession = Depends(get_db),  # noqa: B008
) -> User:
    if data.telegram_chat_id is not None:
        current_user.telegram_chat_id = data.telegram_chat_id or None
    if data.profile_text is not None:
        current_user.profile_text = data.profile_text or None
    session.add(current_user)
    await session.flush()
    await session.refresh(current_user)
    return current_user
