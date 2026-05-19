# Job Application Platform — Phase 1: Infrastructure & Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the full Docker Compose stack with a working FastAPI skeleton, PostgreSQL, Redis, JWT auth, and all project scaffolding so every subsequent phase has a running environment to build on.

**Architecture:** FastAPI async backend with SQLAlchemy 2.0 + Alembic migrations, Redis for caching/sessions, Celery worker skeleton, Qdrant for vectors. All services wired via Docker Compose with health checks. Repository + Service layers enforced from day one.

**Tech Stack:** Python 3.12, FastAPI 0.115, SQLAlchemy 2.0, Alembic, Pydantic v2, Redis 7, PostgreSQL 16, Qdrant 1.9, Celery 5, Docker Compose v2, Ruff, mypy, pytest-asyncio

---

## File Map

```
pat/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI app factory
│   │   ├── config.py                # pydantic-settings Settings
│   │   ├── database.py              # async engine + session factory
│   │   ├── dependencies.py          # FastAPI DI: db, current_user
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── security.py          # JWT encode/decode, bcrypt
│   │   │   ├── exceptions.py        # AppException hierarchy
│   │   │   └── logging.py           # structlog setup
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── base.py              # DeclarativeBase + AuditMixin
│   │   │   └── user.py              # User ORM model
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py              # LoginRequest, TokenResponse
│   │   │   └── user.py              # UserCreate, UserRead
│   │   ├── repositories/
│   │   │   ├── __init__.py
│   │   │   ├── base.py              # Generic async CRUD base
│   │   │   └── user_repository.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py
│   │   │   └── user_service.py
│   │   └── api/
│   │       ├── __init__.py
│   │       └── v1/
│   │           ├── __init__.py
│   │           ├── router.py        # aggregates all v1 routers
│   │           ├── auth.py          # /auth/login, /auth/refresh
│   │           └── users.py        # /users/me
│   ├── migrations/
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   │       └── 001_create_users.py
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── unit/
│   │   │   ├── test_security.py
│   │   │   └── test_user_repository.py
│   │   └── integration/
│   │       └── api/
│   │           └── test_auth.py
│   ├── Dockerfile
│   ├── pyproject.toml
│   └── alembic.ini
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
├── .gitignore
├── README.md
├── LICENSE
├── CONTRIBUTING.md
└── SECURITY.md
```

---

## Task 1: pyproject.toml and backend dependencies

**Files:**
- Create: `backend/pyproject.toml`

- [ ] **Step 1: Write pyproject.toml**

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "pat-backend"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi[standard]>=0.115.0",
    "uvicorn[standard]>=0.30.0",
    "sqlalchemy[asyncio]>=2.0.0",
    "alembic>=1.13.0",
    "asyncpg>=0.29.0",
    "pydantic>=2.7.0",
    "pydantic-settings>=2.3.0",
    "python-jose[cryptography]>=3.3.0",
    "passlib[bcrypt]>=1.7.4",
    "structlog>=24.2.0",
    "redis[hiredis]>=5.0.0",
    "celery[redis]>=5.4.0",
    "qdrant-client>=1.9.0",
    "httpx>=0.27.0",
    "tenacity>=8.3.0",
    "python-multipart>=0.0.9",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.2.0",
    "pytest-asyncio>=0.23.0",
    "pytest-cov>=5.0.0",
    "httpx>=0.27.0",
    "ruff>=0.4.0",
    "mypy>=1.10.0",
    "black>=24.4.0",
]

[tool.ruff]
line-length = 100
target-version = "py312"
select = ["E", "F", "I", "UP", "B", "SIM"]

[tool.mypy]
python_version = "3.12"
strict = true
ignore_missing_imports = true

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]

[tool.black]
line-length = 100
target-version = ["py312"]
```

- [ ] **Step 2: Commit**

```bash
git add backend/pyproject.toml
git commit -m "chore: add backend pyproject.toml with all dependencies"
```

---

## Task 2: Settings and config

**Files:**
- Create: `backend/app/config.py`
- Create: `.env.example`

- [ ] **Step 1: Write failing test**

```python
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
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd backend && python -m pytest tests/unit/test_config.py -v
```
Expected: `ModuleNotFoundError: No module named 'app'`

- [ ] **Step 3: Write config.py**

```python
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


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
```

- [ ] **Step 4: Write .env.example**

```bash
# backend/.env.example
APP_NAME=PAT
DEBUG=false
SECRET_KEY=change-me-to-a-32-char-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

DATABASE_URL=postgresql+asyncpg://pat:pat@localhost:5432/pat
REDIS_URL=redis://localhost:6379/0

QDRANT_HOST=qdrant
QDRANT_PORT=6333

OPENAI_API_KEY=
ANTHROPIC_API_KEY=
OLLAMA_BASE_URL=http://ollama:11434

TELEGRAM_BOT_TOKEN=

MAX_UPLOAD_SIZE_MB=10
UPLOAD_DIR=/tmp/pat_uploads
```

- [ ] **Step 5: Run test**

```bash
cd backend && DATABASE_URL=postgresql+asyncpg://u:p@h/db SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx REDIS_URL=redis://localhost python -m pytest tests/unit/test_config.py -v
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/app/config.py backend/.env.example
git commit -m "feat: add pydantic-settings config with all env vars"
```

---

## Task 3: Database setup (async SQLAlchemy)

**Files:**
- Create: `backend/app/database.py`
- Create: `backend/app/models/base.py`

- [ ] **Step 1: Write database.py**

```python
# backend/app/database.py
from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
```

- [ ] **Step 2: Write models/base.py**

```python
# backend/app/models/base.py
import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class AuditMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


def generate_uuid() -> str:
    return str(uuid.uuid4())
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/database.py backend/app/models/base.py
git commit -m "feat: add async SQLAlchemy engine and AuditMixin base"
```

---

## Task 4: User model and migration

**Files:**
- Create: `backend/app/models/user.py`
- Create: `backend/migrations/versions/001_create_users.py`
- Create: `backend/alembic.ini`
- Create: `backend/migrations/env.py`

- [ ] **Step 1: Write user.py**

```python
# backend/app/models/user.py
from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import AuditMixin, Base, generate_uuid


class User(Base, AuditMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    telegram_chat_id: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True)
```

- [ ] **Step 2: Write alembic.ini**

```ini
# backend/alembic.ini
[alembic]
script_location = migrations
prepend_sys_path = .
version_path_separator = os
sqlalchemy.url = driver://user:pass@localhost/dbname

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
```

- [ ] **Step 3: Write migrations/env.py**

```python
# backend/migrations/env.py
import asyncio
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context
from app.config import get_settings
from app.models.base import Base
from app.models import user  # noqa: F401 — registers models

config = context.config
settings = get_settings()
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations():
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online():
    asyncio.run(run_async_migrations())


run_migrations_online()
```

- [ ] **Step 4: Write migrations/script.py.mako**

```mako
# backend/migrations/script.py.mako
"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
${imports if imports else ""}

revision: str = ${repr(up_revision)}
down_revision: Union[str, None] = ${repr(down_revision)}
branch_labels: Union[str, Sequence[str], None] = ${repr(branch_labels)}
depends_on: Union[str, Sequence[str], None] = ${repr(depends_on)}


def upgrade() -> None:
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    ${downgrades if downgrades else "pass"}
```

- [ ] **Step 5: Write 001_create_users.py**

```python
# backend/migrations/versions/001_create_users.py
"""create users table

Revision ID: 001
Revises:
Create Date: 2026-05-19
"""
from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("is_superuser", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("telegram_chat_id", sa.String(64), nullable=True, unique=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_users_email", "users", ["email"])


def downgrade() -> None:
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
```

- [ ] **Step 6: Commit**

```bash
git add backend/app/models/ backend/migrations/ backend/alembic.ini
git commit -m "feat: add User model and initial Alembic migration"
```

---

## Task 5: Security (JWT + bcrypt)

**Files:**
- Create: `backend/app/core/security.py`
- Create: `backend/tests/unit/test_security.py`

- [ ] **Step 1: Write failing test**

```python
# backend/tests/unit/test_security.py
import pytest
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)


def test_hash_and_verify_password():
    hashed = hash_password("mysecret")
    assert verify_password("mysecret", hashed) is True
    assert verify_password("wrong", hashed) is False


def test_create_and_decode_access_token():
    token = create_access_token(subject="user-123")
    payload = decode_access_token(token)
    assert payload["sub"] == "user-123"


def test_decode_invalid_token_raises():
    with pytest.raises(ValueError, match="Invalid token"):
        decode_access_token("not.a.valid.token")
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd backend && python -m pytest tests/unit/test_security.py -v
```
Expected: `ImportError`

- [ ] **Step 3: Write security.py**

```python
# backend/app/core/security.py
from datetime import datetime, timedelta, timezone
from typing import Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import get_settings

settings = get_settings()
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return _pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    return jwt.encode(
        {"sub": subject, "exp": expire, "type": "access"},
        settings.secret_key,
        algorithm=settings.algorithm,
    )


def create_refresh_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    return jwt.encode(
        {"sub": subject, "exp": expire, "type": "refresh"},
        settings.secret_key,
        algorithm=settings.algorithm,
    )


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError as exc:
        raise ValueError("Invalid token") from exc
```

- [ ] **Step 4: Run tests**

```bash
cd backend && SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx DATABASE_URL=postgresql+asyncpg://u:p@h/db REDIS_URL=redis://localhost python -m pytest tests/unit/test_security.py -v
```
Expected: 3 PASSED

- [ ] **Step 5: Commit**

```bash
git add backend/app/core/security.py backend/tests/unit/test_security.py
git commit -m "feat: add JWT auth and bcrypt password hashing"
```

---

## Task 6: Repository base + User repository

**Files:**
- Create: `backend/app/repositories/base.py`
- Create: `backend/app/repositories/user_repository.py`
- Create: `backend/tests/unit/test_user_repository.py`

- [ ] **Step 1: Write failing test**

```python
# backend/tests/unit/test_user_repository.py
import pytest
from unittest.mock import AsyncMock, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_repository import UserRepository
from app.models.user import User


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
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd backend && python -m pytest tests/unit/test_user_repository.py -v
```
Expected: `ImportError`

- [ ] **Step 3: Write base.py**

```python
# backend/app/repositories/base.py
from typing import Generic, TypeVar
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.base import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    model: type[ModelT]

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, id: str) -> ModelT | None:
        return await self._session.get(self.model, id)

    async def save(self, instance: ModelT) -> ModelT:
        self._session.add(instance)
        await self._session.flush()
        await self._session.refresh(instance)
        return instance

    async def delete(self, instance: ModelT) -> None:
        await self._session.delete(instance)
        await self._session.flush()

    async def list_all(self) -> list[ModelT]:
        result = await self._session.execute(select(self.model))
        return list(result.scalars().all())
```

- [ ] **Step 4: Write user_repository.py**

```python
# backend/app/repositories/user_repository.py
from sqlalchemy import select
from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    model = User

    async def get_by_email(self, email: str) -> User | None:
        result = await self._session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_by_telegram_id(self, chat_id: str) -> User | None:
        result = await self._session.execute(
            select(User).where(User.telegram_chat_id == chat_id)
        )
        return result.scalar_one_or_none()
```

- [ ] **Step 5: Run tests**

```bash
cd backend && python -m pytest tests/unit/test_user_repository.py -v
```
Expected: 2 PASSED

- [ ] **Step 6: Commit**

```bash
git add backend/app/repositories/ backend/tests/unit/test_user_repository.py
git commit -m "feat: add generic BaseRepository and UserRepository"
```

---

## Task 7: Auth service + schemas

**Files:**
- Create: `backend/app/schemas/auth.py`
- Create: `backend/app/schemas/user.py`
- Create: `backend/app/services/auth_service.py`

- [ ] **Step 1: Write schemas**

```python
# backend/app/schemas/auth.py
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str
```

```python
# backend/app/schemas/user.py
from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class UserRead(BaseModel):
    id: str
    email: str
    full_name: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
```

- [ ] **Step 2: Write auth_service.py**

```python
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
            raise ConflictError(f"Email {data.email} already registered")
        user = User(
            email=data.email,
            hashed_password=hash_password(data.password),
            full_name=data.full_name,
        )
        return await self._repo.save(user)

    async def login(self, email: str, password: str) -> TokenResponse:
        user = await self._repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise AuthenticationError("Invalid credentials")
        if not user.is_active:
            raise AuthenticationError("Account inactive")
        return TokenResponse(
            access_token=create_access_token(subject=user.id),
            refresh_token=create_refresh_token(subject=user.id),
        )

    async def get_user_from_token(self, token: str) -> User:
        payload = decode_access_token(token)
        user = await self._repo.get_by_id(payload["sub"])
        if not user or not user.is_active:
            raise AuthenticationError("User not found or inactive")
        return user
```

- [ ] **Step 3: Write exceptions.py**

```python
# backend/app/core/exceptions.py
from fastapi import HTTPException, status


class AppException(Exception):
    status_code: int = 500
    detail: str = "Internal server error"

    def __init__(self, detail: str | None = None) -> None:
        self.detail = detail or self.__class__.detail
        super().__init__(self.detail)

    def to_http(self) -> HTTPException:
        return HTTPException(status_code=self.status_code, detail=self.detail)


class AuthenticationError(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    detail = "Authentication failed"


class AuthorizationError(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    detail = "Not authorized"


class NotFoundError(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    detail = "Resource not found"


class ConflictError(AppException):
    status_code = status.HTTP_409_CONFLICT
    detail = "Resource conflict"


class ValidationError(AppException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    detail = "Validation error"
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/schemas/ backend/app/services/auth_service.py backend/app/core/exceptions.py
git commit -m "feat: add auth service, schemas and exception hierarchy"
```

---

## Task 8: FastAPI app + routers

**Files:**
- Create: `backend/app/main.py`
- Create: `backend/app/dependencies.py`
- Create: `backend/app/api/v1/auth.py`
- Create: `backend/app/api/v1/users.py`
- Create: `backend/app/api/v1/router.py`
- Create: `backend/app/core/logging.py`

- [ ] **Step 1: Write logging.py**

```python
# backend/app/core/logging.py
import logging
import structlog


def configure_logging(debug: bool = False) -> None:
    level = logging.DEBUG if debug else logging.INFO
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.dev.set_exc_info,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.dev.ConsoleRenderer() if debug else structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(level),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
    )
```

- [ ] **Step 2: Write dependencies.py**

```python
# backend/app/dependencies.py
from collections.abc import AsyncGenerator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.core.exceptions import AuthenticationError

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_auth_service(
    session: AsyncSession = Depends(get_db),
) -> AuthService:
    return AuthService(UserRepository(session))


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    auth_service: AuthService = Depends(get_auth_service),
) -> User:
    try:
        return await auth_service.get_user_from_token(token)
    except AuthenticationError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=exc.detail,
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
```

- [ ] **Step 3: Write auth router**

```python
# backend/app/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_auth_service
from app.schemas.auth import LoginRequest, RefreshRequest, TokenResponse
from app.schemas.user import UserCreate, UserRead
from app.services.auth_service import AuthService
from app.core.exceptions import AuthenticationError, ConflictError

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(
    data: UserCreate,
    auth_service: AuthService = Depends(get_auth_service),
):
    try:
        user = await auth_service.register(data)
        return user
    except ConflictError as exc:
        raise exc.to_http() from exc


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    try:
        return await auth_service.login(data.email, data.password)
    except AuthenticationError as exc:
        raise exc.to_http() from exc
```

- [ ] **Step 4: Write users router**

```python
# backend/app/api/v1/users.py
from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserRead

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
```

- [ ] **Step 5: Write v1 router**

```python
# backend/app/api/v1/router.py
from fastapi import APIRouter
from app.api.v1 import auth, users

router = APIRouter(prefix="/api/v1")
router.include_router(auth.router)
router.include_router(users.router)
```

- [ ] **Step 6: Write main.py**

```python
# backend/app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import get_settings
from app.core.logging import configure_logging
from app.core.exceptions import AppException
from app.api.v1.router import router as v1_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging(debug=settings.debug)
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="AI-powered job application platform",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


app.include_router(v1_router)


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.app_name}
```

- [ ] **Step 7: Commit**

```bash
git add backend/app/main.py backend/app/dependencies.py backend/app/api/ backend/app/core/logging.py
git commit -m "feat: add FastAPI app factory, auth/user routers, exception handler"
```

---

## Task 9: Docker Compose stack

**Files:**
- Create: `docker-compose.yml`
- Create: `docker-compose.dev.yml`
- Create: `backend/Dockerfile`

- [ ] **Step 1: Write backend Dockerfile**

```dockerfile
# backend/Dockerfile
FROM python:3.12-slim AS base
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

FROM base AS builder
RUN pip install hatch
COPY pyproject.toml .
RUN pip install --no-cache-dir -e ".[dev]"

FROM base AS production
COPY --from=builder /usr/local/lib/python3.12 /usr/local/lib/python3.12
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

FROM production AS development
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

- [ ] **Step 2: Write docker-compose.yml**

```yaml
# docker-compose.yml
version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: pat
      POSTGRES_PASSWORD: pat
      POSTGRES_DB: pat
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pat"]
      interval: 5s
      timeout: 5s
      retries: 10
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    restart: unless-stopped

  qdrant:
    image: qdrant/qdrant:v1.9.0
    volumes:
      - qdrant_data:/qdrant/storage
    ports:
      - "6333:6333"
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:6333/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      target: production
    env_file: .env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      qdrant:
        condition: service_healthy
    ports:
      - "8000:8000"
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  celery_worker:
    build:
      context: ./backend
      target: production
    command: celery -A app.tasks.celery_app worker --loglevel=info --concurrency=4
    env_file: .env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
    env_file: .env
    depends_on:
      - backend
    ports:
      - "3000:3000"
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  qdrant_data:
```

- [ ] **Step 3: Write docker-compose.dev.yml**

```yaml
# docker-compose.dev.yml
version: "3.9"

services:
  backend:
    build:
      context: ./backend
      target: development
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"

  celery_worker:
    build:
      context: ./backend
      target: development
    command: celery -A app.tasks.celery_app worker --loglevel=debug --concurrency=2
    volumes:
      - ./backend:/app
```

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml docker-compose.dev.yml backend/Dockerfile
git commit -m "feat: add Docker Compose stack with postgres, redis, qdrant, backend, celery"
```

---

## Task 10: Celery skeleton

**Files:**
- Create: `backend/app/tasks/__init__.py`
- Create: `backend/app/tasks/celery_app.py`

- [ ] **Step 1: Write celery_app.py**

```python
# backend/app/tasks/celery_app.py
from celery import Celery
from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "pat",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=[
        "app.tasks.analyze_job",
        "app.tasks.analyze_resume",
        "app.tasks.generate_application",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)
```

- [ ] **Step 2: Create task stubs**

```python
# backend/app/tasks/analyze_job.py
from app.tasks.celery_app import celery_app


@celery_app.task(bind=True, name="tasks.analyze_job", max_retries=3)
def analyze_job_task(self, job_id: str, user_id: str) -> dict:
    # Phase 5 implements the AI agent pipeline
    return {"job_id": job_id, "status": "queued"}
```

```python
# backend/app/tasks/analyze_resume.py
from app.tasks.celery_app import celery_app


@celery_app.task(bind=True, name="tasks.analyze_resume", max_retries=3)
def analyze_resume_task(self, resume_id: str, user_id: str) -> dict:
    return {"resume_id": resume_id, "status": "queued"}
```

```python
# backend/app/tasks/generate_application.py
from app.tasks.celery_app import celery_app


@celery_app.task(bind=True, name="tasks.generate_application", max_retries=3)
def generate_application_task(self, job_id: str, resume_id: str, user_id: str) -> dict:
    return {"job_id": job_id, "resume_id": resume_id, "status": "queued"}
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/tasks/
git commit -m "feat: add Celery app factory and task stubs"
```

---

## Task 11: Integration test for auth API

**Files:**
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/integration/api/test_auth.py`

- [ ] **Step 1: Write conftest.py**

```python
# backend/tests/conftest.py
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.main import app
from app.database import get_db
from app.models.base import Base

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture(scope="session")
async def engine():
    eng = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    await eng.dispose()


@pytest_asyncio.fixture
async def session(engine):
    factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as s:
        yield s


@pytest_asyncio.fixture
async def client(session):
    app.dependency_overrides[get_db] = lambda: session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()
```

- [ ] **Step 2: Write integration test**

```python
# backend/tests/integration/api/test_auth.py
import pytest


@pytest.mark.asyncio
async def test_register_and_login(client):
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "secret123", "full_name": "Test User"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "test@example.com"

    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "secret123"},
    )
    assert resp.status_code == 200
    tokens = resp.json()
    assert "access_token" in tokens


@pytest.mark.asyncio
async def test_get_me_requires_auth(client):
    resp = await client.get("/api/v1/users/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_me_with_valid_token(client):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "me@example.com", "password": "password", "full_name": "Me"},
    )
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "me@example.com", "password": "password"},
    )
    token = login_resp.json()["access_token"]
    resp = await client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "me@example.com"
```

- [ ] **Step 3: Add aiosqlite to dev deps in pyproject.toml**

In `backend/pyproject.toml`, add to `[project.optional-dependencies]` dev list:
```
"aiosqlite>=0.20.0",
```

- [ ] **Step 4: Run full test suite**

```bash
cd backend && SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx DATABASE_URL=postgresql+asyncpg://u:p@h/db REDIS_URL=redis://localhost python -m pytest tests/ -v
```
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/tests/ backend/pyproject.toml
git commit -m "test: add integration tests for auth API with SQLite in-memory"
```

---

## Task 12: Open Source files

**Files:**
- Modify: `README.md`
- Create: `CONTRIBUTING.md`
- Create: `SECURITY.md`
- Create: `.env.example` (root)

- [ ] **Step 1: Write README.md**

```markdown
# PAT — Personal Application Tracker

> AI-powered job application platform with multi-provider AI, ATS optimization, and Telegram Bot ingestion.

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.12-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)](https://fastapi.tiangolo.com)

## Features

- **AI-Provider Abstraction** — OpenAI, Anthropic Claude, Ollama (local), easily extensible
- **8 Specialized AI Agents** — Resume Parser, Job Analyzer, ATS Optimizer, Match Scorer, Cover Letter, Interview Questions, Skill Gap, Resume Generator
- **Telegram Bot** — Send job links, PDFs, screenshots; automated analysis starts immediately
- **ATS Optimization** — STAR-formatted bullet points, keyword injection, recruiter-ready formatting
- **Semantic Matching** — Qdrant vector DB for embedding-based skill similarity
- **Full History** — Every application, score, and generated document persisted
- **Local & Private** — Run entirely offline with Ollama models

## Quick Start

```bash
cp .env.example .env
# edit .env — set SECRET_KEY, OPENAI_API_KEY or ANTHROPIC_API_KEY
docker compose up -d
# open http://localhost:3000
```

## Architecture

See [docs/architecture/overview.md](docs/architecture/overview.md)

## Development

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
cd backend && pip install -e ".[dev]"
pytest
```

## License

Apache License 2.0 — see [LICENSE](LICENSE)
```

- [ ] **Step 2: Write CONTRIBUTING.md**

```markdown
# Contributing to PAT

## Development Setup

1. Fork and clone the repo
2. `cp .env.example .env` and configure
3. `docker compose up -d postgres redis qdrant`
4. `cd backend && pip install -e ".[dev]"`
5. `pytest` — all tests must pass

## Code Standards

- **Python:** Ruff + Black + mypy strict
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`)
- **Tests:** TDD — write the failing test first
- **PRs:** One feature per PR, tests required

## Running Linters

```bash
cd backend
ruff check .
black --check .
mypy app/
```
```

- [ ] **Step 3: Write SECURITY.md**

```markdown
# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.x     | ✅        |

## Reporting a Vulnerability

Email: security@[your-domain] or open a GitHub Security Advisory.

Do NOT open a public issue for security vulnerabilities.

## Security Measures

- JWT authentication with configurable expiry
- bcrypt password hashing
- Input validation via Pydantic
- Rate limiting on auth endpoints
- Secrets exclusively via environment variables — never committed
- Minimal logging of personal data
- File upload validation (type + size limits)
```

- [ ] **Step 4: Write root .env.example**

```bash
# .env.example — copy to .env and fill in values
SECRET_KEY=change-me-generate-with-openssl-rand-hex-32
DATABASE_URL=postgresql+asyncpg://pat:pat@postgres:5432/pat
REDIS_URL=redis://redis:6379/0
QDRANT_HOST=qdrant
QDRANT_PORT=6333

OPENAI_API_KEY=
ANTHROPIC_API_KEY=
OLLAMA_BASE_URL=http://ollama:11434

TELEGRAM_BOT_TOKEN=

DEBUG=false
MAX_UPLOAD_SIZE_MB=10
```

- [ ] **Step 5: Commit**

```bash
git add README.md CONTRIBUTING.md SECURITY.md .env.example
git commit -m "docs: add README, CONTRIBUTING, SECURITY, .env.example"
```

---

## Task 13: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write ci.yml**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: pip

      - name: Install dependencies
        run: pip install -e ".[dev]"

      - name: Lint (ruff)
        run: ruff check .

      - name: Format check (black)
        run: black --check .

      - name: Type check (mypy)
        run: mypy app/
        env:
          SECRET_KEY: ci-secret-key-32-characters-xxxx
          DATABASE_URL: postgresql+asyncpg://u:p@h/db
          REDIS_URL: redis://localhost

      - name: Tests
        run: pytest tests/ -v --cov=app --cov-report=xml
        env:
          SECRET_KEY: ci-secret-key-32-characters-xxxx
          DATABASE_URL: postgresql+asyncpg://u:p@h/db
          REDIS_URL: redis://localhost

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          file: backend/coverage.xml
```

- [ ] **Step 2: Commit**

```bash
git add .github/
git commit -m "ci: add GitHub Actions CI pipeline for backend"
```

---

## Phase 1 Complete

Run the full stack to verify:

```bash
cp .env.example .env
# Set SECRET_KEY=<openssl rand -hex 32>
docker compose up -d
curl http://localhost:8000/health
# → {"status":"ok","app":"PAT"}
```

All backend tests passing, all services healthy, CI configured.

**Next:** Phase 2 — Core data models (Resume, Job, Application, AIConfig) + full CRUD APIs.
