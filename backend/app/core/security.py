# backend/app/core/security.py
from datetime import UTC, datetime, timedelta
from typing import Any, cast

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import get_settings

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    return cast(str, _pwd_context.hash(password))


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plaintext password against its bcrypt hash."""
    return cast(bool, _pwd_context.verify(plain, hashed))


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    """Create a signed JWT access token."""
    s = get_settings()
    expire = datetime.now(UTC) + (expires_delta or timedelta(minutes=s.access_token_expire_minutes))
    return cast(
        str,
        jwt.encode(
            {"sub": subject, "exp": expire, "type": "access"},
            s.secret_key,
            algorithm=s.algorithm,
        ),
    )


def create_refresh_token(subject: str) -> str:
    """Create a signed JWT refresh token."""
    s = get_settings()
    expire = datetime.now(UTC) + timedelta(days=s.refresh_token_expire_days)
    return cast(
        str,
        jwt.encode(
            {"sub": subject, "exp": expire, "type": "refresh"},
            s.secret_key,
            algorithm=s.algorithm,
        ),
    )


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT access token.

    Raises ValueError for invalid/expired tokens or wrong type.
    """
    s = get_settings()
    try:
        payload: dict[str, Any] = jwt.decode(token, s.secret_key, algorithms=[s.algorithm])
    except JWTError as exc:
        raise ValueError("Invalid token") from exc
    if payload.get("type") != "access":
        raise ValueError("Invalid token")
    return payload


def decode_refresh_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT refresh token.

    Raises ValueError for invalid/expired tokens or wrong type.
    """
    s = get_settings()
    try:
        payload: dict[str, Any] = jwt.decode(token, s.secret_key, algorithms=[s.algorithm])
    except JWTError as exc:
        raise ValueError("Invalid token") from exc
    if payload.get("type") != "refresh":
        raise ValueError("Invalid token")
    return payload
