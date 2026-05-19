# backend/tests/unit/test_config.py
import pytest
from pydantic import ValidationError
from app.config import Settings, get_settings


def test_settings_defaults():
    s = Settings(
        database_url="postgresql+asyncpg://u:p@localhost/db",
        secret_key="x" * 32,
        redis_url="redis://localhost:6379/0",
    )
    assert s.access_token_expire_minutes == 30
    assert s.algorithm == "HS256"
    assert s.app_name == "PAT"


def test_secret_key_too_short_raises():
    with pytest.raises(ValidationError):
        Settings(
            database_url="postgresql+asyncpg://u:p@localhost/db",
            secret_key="short",
        )


def test_database_url_wrong_scheme_raises():
    with pytest.raises(ValidationError):
        Settings(
            database_url="postgresql://u:p@localhost/db",
            secret_key="x" * 32,
        )


def test_get_settings_caching(monkeypatch):
    monkeypatch.setenv("SECRET_KEY", "x" * 32)
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://u:p@localhost/db")
    get_settings.cache_clear()
    s1 = get_settings()
    s2 = get_settings()
    assert isinstance(s1, Settings)
    assert s1 is s2
    get_settings.cache_clear()


def test_algorithm_invalid_raises():
    with pytest.raises(ValidationError):
        Settings(
            database_url="postgresql+asyncpg://u:p@localhost/db",
            secret_key="x" * 32,
            algorithm="RS256",
        )
