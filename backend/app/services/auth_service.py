# backend/app/services/auth_service.py
from app.core.exceptions import AuthenticationError, ConflictError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import TokenResponse
from app.schemas.user import UserCreate


class AuthService:
    def __init__(self, user_repo: UserRepository) -> None:
        self._repo = user_repo

    async def register(self, data: UserCreate) -> User:
        existing = await self._repo.get_by_email(data.email)
        if existing:
            raise ConflictError("An account with this email address already exists")
        user = User(
            email=data.email,
            hashed_password=hash_password(data.password),
            full_name=data.full_name,
        )
        return await self._repo.save(user)

    async def login(self, email: str, password: str) -> TokenResponse:
        user = await self._repo.get_by_email(email)
        # Always run bcrypt to prevent timing-based email enumeration
        candidate_hash = user.hashed_password if user else ""
        password_valid = verify_password(password, candidate_hash)
        if not user or not password_valid:
            raise AuthenticationError("Invalid credentials")
        if not user.is_active:
            raise AuthenticationError("Account inactive")
        return TokenResponse(
            access_token=create_access_token(subject=user.id),
            refresh_token=create_refresh_token(subject=user.id),
        )

    async def get_user_from_token(self, token: str) -> User:
        try:
            payload = decode_access_token(token)
        except ValueError as e:
            raise AuthenticationError("Invalid token") from e
        user = await self._repo.get_by_id(payload["sub"])
        if not user or not user.is_active:
            raise AuthenticationError("User not found or inactive")
        return user
