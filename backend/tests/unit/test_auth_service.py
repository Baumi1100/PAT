from unittest.mock import AsyncMock, patch

import pytest

from app.core.exceptions import AuthenticationError, ConflictError
from app.models.user import User
from app.schemas.user import UserCreate
from app.services.auth_service import AuthService


@pytest.fixture
def mock_repo():
    return AsyncMock()


@pytest.fixture
def service(mock_repo):
    return AuthService(mock_repo)


@pytest.mark.asyncio
async def test_register_creates_user(service, mock_repo):
    with patch("app.services.auth_service.hash_password") as mock_hash:
        mock_hash.return_value = "hashed_pass123"
        mock_repo.get_by_email.return_value = None
        mock_repo.save.return_value = User(
            id="1", email="a@b.com", hashed_password="hashed_pass123", full_name="Test"
        )
        data = UserCreate(email="a@b.com", password="pass123", full_name="Test")
        user = await service.register(data)
        assert user.email == "a@b.com"
        mock_repo.save.assert_called_once()
        mock_hash.assert_called_once_with("pass123")


@pytest.mark.asyncio
async def test_register_raises_conflict_on_duplicate(service, mock_repo):
    mock_repo.get_by_email.return_value = User(
        id="1", email="a@b.com", hashed_password="x", full_name="Existing"
    )
    data = UserCreate(email="a@b.com", password="pass123", full_name="Test")
    with pytest.raises(ConflictError) as exc_info:
        await service.register(data)
    # Verify that the error message doesn't leak the email
    assert "a@b.com" not in str(exc_info.value)


@pytest.mark.asyncio
async def test_login_success(service, mock_repo):
    with patch("app.services.auth_service.verify_password") as mock_verify, \
         patch("app.services.auth_service.create_access_token") as mock_access, \
         patch("app.services.auth_service.create_refresh_token") as mock_refresh:
        mock_verify.return_value = True
        mock_access.return_value = "access_token_value"
        mock_refresh.return_value = "refresh_token_value"
        mock_repo.get_by_email.return_value = User(
            id="user-1", email="a@b.com", hashed_password="hashed",
            full_name="Test", is_active=True
        )
        result = await service.login("a@b.com", "pass123")
        assert result.access_token == "access_token_value"
        assert result.refresh_token == "refresh_token_value"
        assert result.token_type == "bearer"
        mock_verify.assert_called_once_with("pass123", "hashed")


@pytest.mark.asyncio
async def test_login_wrong_password_raises(service, mock_repo):
    with patch("app.services.auth_service.verify_password") as mock_verify:
        mock_verify.return_value = False
        mock_repo.get_by_email.return_value = User(
            id="user-1", email="a@b.com", hashed_password="hashed",
            full_name="Test", is_active=True
        )
        with pytest.raises(AuthenticationError):
            await service.login("a@b.com", "wrong")
        mock_verify.assert_called_once()


@pytest.mark.asyncio
async def test_login_user_not_found_raises(service, mock_repo):
    with patch("app.services.auth_service.verify_password") as mock_verify:
        mock_verify.return_value = False
        mock_repo.get_by_email.return_value = None
        with pytest.raises(AuthenticationError) as exc_info:
            await service.login("nobody@b.com", "pass")
        # Verify verify_password was still called (constant-time check)
        mock_verify.assert_called_once_with("pass", "")
        assert "Invalid credentials" in str(exc_info.value)


@pytest.mark.asyncio
async def test_login_inactive_user_raises(service, mock_repo):
    with patch("app.services.auth_service.verify_password") as mock_verify:
        mock_verify.return_value = True
        mock_repo.get_by_email.return_value = User(
            id="user-1", email="a@b.com", hashed_password="hashed",
            full_name="Test", is_active=False
        )
        with pytest.raises(AuthenticationError) as exc_info:
            await service.login("a@b.com", "pass123")
        assert "inactive" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_get_user_from_token(service, mock_repo):
    with patch("app.services.auth_service.decode_access_token") as mock_decode:
        mock_decode.return_value = {"sub": "user-1"}
        mock_repo.get_by_id.return_value = User(
            id="user-1", email="a@b.com", hashed_password="x",
            full_name="Test", is_active=True
        )
        user = await service.get_user_from_token("valid.token.here")
        assert user.id == "user-1"
        mock_decode.assert_called_once_with("valid.token.here")


@pytest.mark.asyncio
async def test_get_user_from_invalid_token_raises(service, mock_repo):
    with patch("app.services.auth_service.decode_access_token") as mock_decode:
        mock_decode.side_effect = ValueError("Invalid token")
        with pytest.raises(AuthenticationError):
            await service.get_user_from_token("invalid.token.here")
