# backend/app/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


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


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
