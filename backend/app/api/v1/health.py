# backend/app/api/v1/health.py
from fastapi import APIRouter, Depends

from app.ai.registry import provider_registry
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/ai-providers")
async def ai_provider_health(
    current_user: User = Depends(get_current_user),  # noqa: B008
) -> dict[str, bool]:
    return await provider_registry.health_check_all()
