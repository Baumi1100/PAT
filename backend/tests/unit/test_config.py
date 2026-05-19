# backend/tests/unit/test_config.py
from app.config import Settings


def test_settings_defaults():
    s = Settings(
        database_url="postgresql+asyncpg://u:p@localhost/db",
        secret_key="x" * 32,
        redis_url="redis://localhost:6379/0",
    )
    assert s.access_token_expire_minutes == 30
    assert s.algorithm == "HS256"
    assert s.app_name == "PAT"
