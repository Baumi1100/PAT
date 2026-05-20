# backend/tests/unit/test_user_repository.py
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.user_repository import UserRepository


@pytest.fixture
def mock_session():
    session = AsyncMock(spec=AsyncSession)
    return session


@pytest.fixture
def repo(mock_session):
    return UserRepository(mock_session)


@pytest.mark.asyncio
async def test_get_by_email_returns_user(repo, mock_session):
    user = User(id="1", email="a@b.com", hashed_password="x", full_name="Test")
    result = MagicMock()
    result.scalar_one_or_none.return_value = user
    mock_session.execute.return_value = result

    found = await repo.get_by_email("a@b.com")
    assert found is user


@pytest.mark.asyncio
async def test_get_by_email_returns_none_when_missing(repo, mock_session):
    result = MagicMock()
    result.scalar_one_or_none.return_value = None
    mock_session.execute.return_value = result

    found = await repo.get_by_email("missing@b.com")
    assert found is None
