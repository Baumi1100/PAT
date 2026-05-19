# backend/app/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.exceptions import AuthenticationError, ConflictError
from app.core.security import create_access_token, decode_refresh_token
from app.dependencies import get_auth_service
from app.schemas.auth import LoginRequest, RefreshRequest, TokenResponse
from app.schemas.user import UserCreate, UserRead
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(
    data: UserCreate,
    auth_service: AuthService = Depends(get_auth_service),  # noqa: B008
):
    try:
        user = await auth_service.register(data)
        return user
    except ConflictError as exc:
        raise exc.to_http() from exc


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),  # noqa: B008
):
    try:
        return await auth_service.login(data.email, data.password)
    except AuthenticationError as exc:
        raise exc.to_http() from exc


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    data: RefreshRequest,
):
    try:
        payload = decode_refresh_token(data.refresh_token)
        access_token = create_access_token(subject=payload["sub"])
        return TokenResponse(
            access_token=access_token,
            refresh_token=data.refresh_token,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        ) from exc
