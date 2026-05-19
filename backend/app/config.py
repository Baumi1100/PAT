# backend/app/config.py
from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_ALLOWED_ALGORITHMS = frozenset({"HS256", "HS384", "HS512"})


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "PAT"
    debug: bool = False
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    database_url: str
    redis_url: str = "redis://localhost:6379/0"
    db_pool_size: int = 10
    db_max_overflow: int = 20

    qdrant_host: str = "localhost"
    qdrant_port: int = 6333

    # AI Providers
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    ollama_base_url: str = "http://localhost:11434"

    # Telegram
    telegram_bot_token: str = ""

    # Upload
    max_upload_size_mb: int = 10
    upload_dir: str = "/tmp/pat_uploads"

    # Export (LaTeX → PDF)
    export_dir: str = "/tmp/pat_exports"

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    @field_validator("secret_key")
    @classmethod
    def secret_key_min_length(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("secret_key must be at least 32 characters")
        return v

    @field_validator("database_url")
    @classmethod
    def database_url_must_be_async(cls, v: str) -> str:
        if not v.startswith("postgresql+asyncpg://"):
            raise ValueError("database_url must use the postgresql+asyncpg:// scheme")
        return v

    @field_validator("algorithm")
    @classmethod
    def algorithm_must_be_hmac(cls, v: str) -> str:
        if v not in _ALLOWED_ALGORITHMS:
            raise ValueError(f"algorithm must be one of {_ALLOWED_ALGORITHMS}")
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
