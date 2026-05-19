# Job Application Platform — Phase 2: Core Data Models & CRUD APIs

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add all domain models (Resume, Job, Application, AIProviderConfig), Alembic migrations, repository/service layers, and REST CRUD endpoints so the frontend and AI agents have a stable data layer to read/write.

**Architecture:** Extends Phase 1 patterns — one model per file, one repository per model, one service per domain, one router per resource. All IDs are UUID strings. Foreign keys reference `users.id`. Soft-delete via `deleted_at` on sensitive tables.

**Tech Stack:** SQLAlchemy 2.0, Alembic, Pydantic v2, FastAPI, pytest-asyncio + SQLite in-memory for tests.

**Prerequisite:** Phase 1 complete and all tests passing.

---

## File Map

```
backend/
├── app/
│   ├── models/
│   │   ├── resume.py
│   │   ├── job.py
│   │   ├── application.py
│   │   └── ai_config.py
│   ├── schemas/
│   │   ├── resume.py
│   │   ├── job.py
│   │   ├── application.py
│   │   └── ai_config.py
│   ├── repositories/
│   │   ├── resume_repository.py
│   │   ├── job_repository.py
│   │   ├── application_repository.py
│   │   └── ai_config_repository.py
│   ├── services/
│   │   ├── resume_service.py
│   │   ├── job_service.py
│   │   ├── application_service.py
│   │   └── ai_config_service.py
│   └── api/
│       └── v1/
│           ├── resumes.py
│           ├── jobs.py
│           ├── applications.py
│           └── ai_config.py
├── migrations/
│   └── versions/
│       ├── 002_create_resumes.py
│       ├── 003_create_jobs.py
│       ├── 004_create_applications.py
│       └── 005_create_ai_configs.py
└── tests/
    ├── unit/
    │   └── test_job_repository.py
    └── integration/
        └── api/
            ├── test_resumes.py
            ├── test_jobs.py
            └── test_applications.py
```

---

## Task 1: Resume model + migration

**Files:**
- Create: `backend/app/models/resume.py`
- Create: `backend/migrations/versions/002_create_resumes.py`

- [ ] **Step 1: Write resume.py**

```python
# backend/app/models/resume.py
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import AuditMixin, Base, generate_uuid


class Resume(Base, AuditMixin):
    __tablename__ = "resumes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    file_type: Mapped[str | None] = mapped_column(String(50), nullable=True)  # pdf, docx, txt
    parsed_data: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON blob from parser agent
    is_primary: Mapped[bool] = mapped_column(default=False, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="resumes")  # type: ignore[name-defined]
    applications: Mapped[list["Application"]] = relationship("Application", back_populates="resume")  # type: ignore[name-defined]
```

- [ ] **Step 2: Add back-reference to user.py**

In `backend/app/models/user.py`, add after the `telegram_chat_id` line:

```python
    from sqlalchemy.orm import relationship
    resumes: Mapped[list["Resume"]] = relationship("Resume", back_populates="user", lazy="select")
```

Actually, add the import at the top of user.py and add the relationship:

Edit `backend/app/models/user.py` — add these imports and field:
```python
from sqlalchemy.orm import Mapped, mapped_column, relationship
# and add field:
    resumes: Mapped[list["Resume"]] = relationship("Resume", back_populates="user", lazy="select")
```

- [ ] **Step 3: Write migration 002**

```python
# backend/migrations/versions/002_create_resumes.py
"""create resumes table

Revision ID: 002
Revises: 001
Create Date: 2026-05-19
"""
from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "resumes",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("raw_text", sa.Text, nullable=True),
        sa.Column("file_path", sa.String(500), nullable=True),
        sa.Column("file_name", sa.String(255), nullable=True),
        sa.Column("file_type", sa.String(50), nullable=True),
        sa.Column("parsed_data", sa.Text, nullable=True),
        sa.Column("is_primary", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_resumes_user_id", "resumes", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_resumes_user_id", "resumes")
    op.drop_table("resumes")
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/models/resume.py backend/migrations/versions/002_create_resumes.py backend/app/models/user.py
git commit -m "feat: add Resume model and migration"
```

---

## Task 2: Job model + migration

**Files:**
- Create: `backend/app/models/job.py`
- Create: `backend/migrations/versions/003_create_jobs.py`

- [ ] **Step 1: Write job.py**

```python
# backend/app/models/job.py
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import AuditMixin, Base, generate_uuid


class Job(Base, AuditMixin):
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    company: Mapped[str | None] = mapped_column(String(255), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    url: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String(50), nullable=False, default="manual")  # telegram, manual, rss
    parsed_data: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON from Job Analysis Agent
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="new")  # new, analyzing, analyzed, error
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    applications: Mapped[list["Application"]] = relationship("Application", back_populates="job")  # type: ignore[name-defined]
```

- [ ] **Step 2: Write migration 003**

```python
# backend/migrations/versions/003_create_jobs.py
"""create jobs table

Revision ID: 003
Revises: 002
Create Date: 2026-05-19
"""
from alembic import op
import sqlalchemy as sa

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "jobs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("company", sa.String(255), nullable=True),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("url", sa.String(2000), nullable=True),
        sa.Column("raw_text", sa.Text, nullable=True),
        sa.Column("source", sa.String(50), nullable=False, server_default="manual"),
        sa.Column("parsed_data", sa.Text, nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="new"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_jobs_user_id", "jobs", ["user_id"])
    op.create_index("ix_jobs_status", "jobs", ["status"])


def downgrade() -> None:
    op.drop_index("ix_jobs_status", "jobs")
    op.drop_index("ix_jobs_user_id", "jobs")
    op.drop_table("jobs")
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/models/job.py backend/migrations/versions/003_create_jobs.py
git commit -m "feat: add Job model and migration"
```

---

## Task 3: Application model + migration

**Files:**
- Create: `backend/app/models/application.py`
- Create: `backend/migrations/versions/004_create_applications.py`

- [ ] **Step 1: Write application.py**

```python
# backend/app/models/application.py
from sqlalchemy import Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import AuditMixin, Base, generate_uuid


class Application(Base, AuditMixin):
    __tablename__ = "applications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("jobs.id"), nullable=False, index=True)
    resume_id: Mapped[str] = mapped_column(String(36), ForeignKey("resumes.id"), nullable=False)

    # Match results
    match_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    strengths: Mapped[str | None] = mapped_column(Text, nullable=True)      # JSON list
    weaknesses: Mapped[str | None] = mapped_column(Text, nullable=True)     # JSON list
    skill_gaps: Mapped[str | None] = mapped_column(Text, nullable=True)     # JSON list
    suggestions: Mapped[str | None] = mapped_column(Text, nullable=True)    # JSON list

    # Generated documents
    optimized_resume: Mapped[str | None] = mapped_column(Text, nullable=True)   # JSON structured resume
    cover_letter: Mapped[str | None] = mapped_column(Text, nullable=True)
    interview_questions: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON list

    # Workflow state
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")
    # pending → analyzing → scored → generating → complete → error
    celery_task_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    job: Mapped["Job"] = relationship("Job", back_populates="applications")  # type: ignore[name-defined]
    resume: Mapped["Resume"] = relationship("Resume", back_populates="applications")  # type: ignore[name-defined]
```

- [ ] **Step 2: Write migration 004**

```python
# backend/migrations/versions/004_create_applications.py
"""create applications table

Revision ID: 004
Revises: 003
Create Date: 2026-05-19
"""
from alembic import op
import sqlalchemy as sa

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "applications",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("job_id", sa.String(36), sa.ForeignKey("jobs.id"), nullable=False),
        sa.Column("resume_id", sa.String(36), sa.ForeignKey("resumes.id"), nullable=False),
        sa.Column("match_score", sa.Float, nullable=True),
        sa.Column("strengths", sa.Text, nullable=True),
        sa.Column("weaknesses", sa.Text, nullable=True),
        sa.Column("skill_gaps", sa.Text, nullable=True),
        sa.Column("suggestions", sa.Text, nullable=True),
        sa.Column("optimized_resume", sa.Text, nullable=True),
        sa.Column("cover_letter", sa.Text, nullable=True),
        sa.Column("interview_questions", sa.Text, nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="pending"),
        sa.Column("celery_task_id", sa.String(255), nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_applications_user_id", "applications", ["user_id"])
    op.create_index("ix_applications_job_id", "applications", ["job_id"])
    op.create_index("ix_applications_status", "applications", ["status"])


def downgrade() -> None:
    op.drop_index("ix_applications_status", "applications")
    op.drop_index("ix_applications_job_id", "applications")
    op.drop_index("ix_applications_user_id", "applications")
    op.drop_table("applications")
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/models/application.py backend/migrations/versions/004_create_applications.py
git commit -m "feat: add Application model and migration"
```

---

## Task 4: AIProviderConfig model + migration

**Files:**
- Create: `backend/app/models/ai_config.py`
- Create: `backend/migrations/versions/005_create_ai_configs.py`

- [ ] **Step 1: Write ai_config.py**

```python
# backend/app/models/ai_config.py
from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import AuditMixin, Base, generate_uuid


class AIProviderConfig(Base, AuditMixin):
    __tablename__ = "ai_provider_configs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)

    # Which agent task this config applies to
    task_type: Mapped[str] = mapped_column(String(100), nullable=False)
    # resume_parsing | job_analysis | ats_keywords | match_scoring
    # resume_optimization | cover_letter | interview_questions | skill_gap

    provider: Mapped[str] = mapped_column(String(50), nullable=False)  # openai | anthropic | ollama
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    extra_params: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON: temperature, etc.
```

- [ ] **Step 2: Write migration 005**

```python
# backend/migrations/versions/005_create_ai_configs.py
"""create ai_provider_configs table

Revision ID: 005
Revises: 004
Create Date: 2026-05-19
"""
from alembic import op
import sqlalchemy as sa

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None

TASK_TYPES = [
    "resume_parsing", "job_analysis", "ats_keywords", "match_scoring",
    "resume_optimization", "cover_letter", "interview_questions", "skill_gap",
]


def upgrade() -> None:
    op.create_table(
        "ai_provider_configs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("task_type", sa.String(100), nullable=False),
        sa.Column("provider", sa.String(50), nullable=False),
        sa.Column("model", sa.String(100), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("extra_params", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_ai_provider_configs_user_id", "ai_provider_configs", ["user_id"])
    op.create_unique_constraint(
        "uq_ai_config_user_task", "ai_provider_configs", ["user_id", "task_type"]
    )


def downgrade() -> None:
    op.drop_constraint("uq_ai_config_user_task", "ai_provider_configs", type_="unique")
    op.drop_index("ix_ai_provider_configs_user_id", "ai_provider_configs")
    op.drop_table("ai_provider_configs")
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/models/ai_config.py backend/migrations/versions/005_create_ai_configs.py
git commit -m "feat: add AIProviderConfig model and migration"
```

---

## Task 5: Resume schemas + repository + service

**Files:**
- Create: `backend/app/schemas/resume.py`
- Create: `backend/app/repositories/resume_repository.py`
- Create: `backend/app/services/resume_service.py`

- [ ] **Step 1: Write schemas/resume.py**

```python
# backend/app/schemas/resume.py
from datetime import datetime
from pydantic import BaseModel


class ResumeCreate(BaseModel):
    title: str
    raw_text: str | None = None
    is_primary: bool = False


class ResumeUpdate(BaseModel):
    title: str | None = None
    is_primary: bool | None = None


class ResumeRead(BaseModel):
    id: str
    user_id: str
    title: str
    file_name: str | None
    file_type: str | None
    is_primary: bool
    status: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
```

- [ ] **Step 2: Write resume_repository.py**

```python
# backend/app/repositories/resume_repository.py
from sqlalchemy import select
from app.models.resume import Resume
from app.repositories.base import BaseRepository


class ResumeRepository(BaseRepository[Resume]):
    model = Resume

    async def list_by_user(self, user_id: str) -> list[Resume]:
        result = await self._session.execute(
            select(Resume)
            .where(Resume.user_id == user_id, Resume.deleted_at.is_(None))
            .order_by(Resume.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_primary(self, user_id: str) -> Resume | None:
        result = await self._session.execute(
            select(Resume).where(
                Resume.user_id == user_id,
                Resume.is_primary.is_(True),
                Resume.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()
```

- [ ] **Step 3: Write resume_service.py**

```python
# backend/app/services/resume_service.py
from app.core.exceptions import NotFoundError, AuthorizationError
from app.models.resume import Resume
from app.repositories.resume_repository import ResumeRepository
from app.schemas.resume import ResumeCreate, ResumeUpdate
from datetime import datetime, timezone


class ResumeService:
    def __init__(self, repo: ResumeRepository) -> None:
        self._repo = repo

    async def create(self, user_id: str, data: ResumeCreate) -> Resume:
        resume = Resume(user_id=user_id, **data.model_dump())
        if data.is_primary:
            await self._unset_primary(user_id)
        return await self._repo.save(resume)

    async def list_for_user(self, user_id: str) -> list[Resume]:
        return await self._repo.list_by_user(user_id)

    async def get_for_user(self, resume_id: str, user_id: str) -> Resume:
        resume = await self._repo.get_by_id(resume_id)
        if not resume or resume.deleted_at:
            raise NotFoundError("Resume not found")
        if resume.user_id != user_id:
            raise AuthorizationError("Not your resume")
        return resume

    async def update(self, resume_id: str, user_id: str, data: ResumeUpdate) -> Resume:
        resume = await self.get_for_user(resume_id, user_id)
        if data.title is not None:
            resume.title = data.title
        if data.is_primary is not None:
            if data.is_primary:
                await self._unset_primary(user_id)
            resume.is_primary = data.is_primary
        return await self._repo.save(resume)

    async def delete(self, resume_id: str, user_id: str) -> None:
        resume = await self.get_for_user(resume_id, user_id)
        resume.deleted_at = datetime.now(timezone.utc)
        await self._repo.save(resume)

    async def _unset_primary(self, user_id: str) -> None:
        existing = await self._repo.get_primary(user_id)
        if existing:
            existing.is_primary = False
            await self._repo.save(existing)
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/schemas/resume.py backend/app/repositories/resume_repository.py backend/app/services/resume_service.py
git commit -m "feat: add Resume schemas, repository, and service"
```

---

## Task 6: Job schemas + repository + service

**Files:**
- Create: `backend/app/schemas/job.py`
- Create: `backend/app/repositories/job_repository.py`
- Create: `backend/app/services/job_service.py`

- [ ] **Step 1: Write schemas/job.py**

```python
# backend/app/schemas/job.py
from datetime import datetime
from pydantic import BaseModel


class JobCreate(BaseModel):
    title: str
    company: str | None = None
    location: str | None = None
    url: str | None = None
    raw_text: str | None = None
    source: str = "manual"


class JobRead(BaseModel):
    id: str
    user_id: str
    title: str
    company: str | None
    location: str | None
    url: str | None
    source: str
    status: str
    match_score: float | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
```

- [ ] **Step 2: Write job_repository.py**

```python
# backend/app/repositories/job_repository.py
from sqlalchemy import select
from app.models.job import Job
from app.repositories.base import BaseRepository


class JobRepository(BaseRepository[Job]):
    model = Job

    async def list_by_user(self, user_id: str, status: str | None = None) -> list[Job]:
        stmt = select(Job).where(Job.user_id == user_id, Job.deleted_at.is_(None))
        if status:
            stmt = stmt.where(Job.status == status)
        stmt = stmt.order_by(Job.created_at.desc())
        result = await self._session.execute(stmt)
        return list(result.scalars().all())
```

- [ ] **Step 3: Write job_service.py**

```python
# backend/app/services/job_service.py
from app.core.exceptions import NotFoundError, AuthorizationError
from app.models.job import Job
from app.repositories.job_repository import JobRepository
from app.schemas.job import JobCreate
from datetime import datetime, timezone


class JobService:
    def __init__(self, repo: JobRepository) -> None:
        self._repo = repo

    async def create(self, user_id: str, data: JobCreate) -> Job:
        job = Job(user_id=user_id, **data.model_dump())
        return await self._repo.save(job)

    async def list_for_user(self, user_id: str, status: str | None = None) -> list[Job]:
        return await self._repo.list_by_user(user_id, status=status)

    async def get_for_user(self, job_id: str, user_id: str) -> Job:
        job = await self._repo.get_by_id(job_id)
        if not job or job.deleted_at:
            raise NotFoundError("Job not found")
        if job.user_id != user_id:
            raise AuthorizationError("Not your job")
        return job

    async def delete(self, job_id: str, user_id: str) -> None:
        job = await self.get_for_user(job_id, user_id)
        job.deleted_at = datetime.now(timezone.utc)
        await self._repo.save(job)
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/schemas/job.py backend/app/repositories/job_repository.py backend/app/services/job_service.py
git commit -m "feat: add Job schemas, repository, and service"
```

---

## Task 7: Application schemas + repository + service

**Files:**
- Create: `backend/app/schemas/application.py`
- Create: `backend/app/repositories/application_repository.py`
- Create: `backend/app/services/application_service.py`

- [ ] **Step 1: Write schemas/application.py**

```python
# backend/app/schemas/application.py
from datetime import datetime
from pydantic import BaseModel


class ApplicationCreate(BaseModel):
    job_id: str
    resume_id: str


class ApplicationRead(BaseModel):
    id: str
    user_id: str
    job_id: str
    resume_id: str
    match_score: float | None
    status: str
    celery_task_id: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ApplicationDetail(ApplicationRead):
    strengths: list[str] | None = None
    weaknesses: list[str] | None = None
    skill_gaps: list[str] | None = None
    suggestions: list[str] | None = None
    cover_letter: str | None = None
    interview_questions: list[str] | None = None
```

- [ ] **Step 2: Write application_repository.py**

```python
# backend/app/repositories/application_repository.py
from sqlalchemy import select
from app.models.application import Application
from app.repositories.base import BaseRepository


class ApplicationRepository(BaseRepository[Application]):
    model = Application

    async def list_by_user(self, user_id: str) -> list[Application]:
        result = await self._session.execute(
            select(Application)
            .where(Application.user_id == user_id)
            .order_by(Application.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_job_and_resume(self, job_id: str, resume_id: str) -> Application | None:
        result = await self._session.execute(
            select(Application).where(
                Application.job_id == job_id, Application.resume_id == resume_id
            )
        )
        return result.scalar_one_or_none()
```

- [ ] **Step 3: Write application_service.py**

```python
# backend/app/services/application_service.py
import json
from app.core.exceptions import NotFoundError, AuthorizationError, ConflictError
from app.models.application import Application
from app.repositories.application_repository import ApplicationRepository
from app.schemas.application import ApplicationCreate, ApplicationDetail


class ApplicationService:
    def __init__(self, repo: ApplicationRepository) -> None:
        self._repo = repo

    async def create(self, user_id: str, data: ApplicationCreate) -> Application:
        existing = await self._repo.get_by_job_and_resume(data.job_id, data.resume_id)
        if existing:
            raise ConflictError("Application already exists for this job/resume combination")
        application = Application(
            user_id=user_id,
            job_id=data.job_id,
            resume_id=data.resume_id,
            status="pending",
        )
        return await self._repo.save(application)

    async def list_for_user(self, user_id: str) -> list[Application]:
        return await self._repo.list_by_user(user_id)

    async def get_for_user(self, application_id: str, user_id: str) -> Application:
        app = await self._repo.get_by_id(application_id)
        if not app:
            raise NotFoundError("Application not found")
        if app.user_id != user_id:
            raise AuthorizationError("Not your application")
        return app

    async def get_detail(self, application_id: str, user_id: str) -> ApplicationDetail:
        app = await self.get_for_user(application_id, user_id)
        return ApplicationDetail(
            **{
                **{c: getattr(app, c) for c in [
                    "id", "user_id", "job_id", "resume_id", "match_score",
                    "status", "celery_task_id", "created_at",
                ]},
                "strengths": json.loads(app.strengths) if app.strengths else None,
                "weaknesses": json.loads(app.weaknesses) if app.weaknesses else None,
                "skill_gaps": json.loads(app.skill_gaps) if app.skill_gaps else None,
                "suggestions": json.loads(app.suggestions) if app.suggestions else None,
                "cover_letter": app.cover_letter,
                "interview_questions": json.loads(app.interview_questions) if app.interview_questions else None,
            }
        )
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/schemas/application.py backend/app/repositories/application_repository.py backend/app/services/application_service.py
git commit -m "feat: add Application schemas, repository, and service"
```

---

## Task 8: REST API routers for all resources

**Files:**
- Create: `backend/app/api/v1/resumes.py`
- Create: `backend/app/api/v1/jobs.py`
- Create: `backend/app/api/v1/applications.py`
- Modify: `backend/app/api/v1/router.py`

- [ ] **Step 1: Write resumes.py router**

```python
# backend/app/api/v1/resumes.py
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.repositories.resume_repository import ResumeRepository
from app.schemas.resume import ResumeCreate, ResumeRead, ResumeUpdate
from app.services.resume_service import ResumeService
from app.core.exceptions import NotFoundError, AuthorizationError

router = APIRouter(prefix="/resumes", tags=["resumes"])


def _svc(session: AsyncSession = Depends(get_db)) -> ResumeService:
    return ResumeService(ResumeRepository(session))


@router.post("/", response_model=ResumeRead, status_code=status.HTTP_201_CREATED)
async def create_resume(
    data: ResumeCreate,
    current_user: User = Depends(get_current_user),
    svc: ResumeService = Depends(_svc),
):
    return await svc.create(current_user.id, data)


@router.get("/", response_model=list[ResumeRead])
async def list_resumes(
    current_user: User = Depends(get_current_user),
    svc: ResumeService = Depends(_svc),
):
    return await svc.list_for_user(current_user.id)


@router.get("/{resume_id}", response_model=ResumeRead)
async def get_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    svc: ResumeService = Depends(_svc),
):
    try:
        return await svc.get_for_user(resume_id, current_user.id)
    except (NotFoundError, AuthorizationError) as exc:
        raise exc.to_http() from exc


@router.patch("/{resume_id}", response_model=ResumeRead)
async def update_resume(
    resume_id: str,
    data: ResumeUpdate,
    current_user: User = Depends(get_current_user),
    svc: ResumeService = Depends(_svc),
):
    try:
        return await svc.update(resume_id, current_user.id, data)
    except (NotFoundError, AuthorizationError) as exc:
        raise exc.to_http() from exc


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    svc: ResumeService = Depends(_svc),
):
    try:
        await svc.delete(resume_id, current_user.id)
    except (NotFoundError, AuthorizationError) as exc:
        raise exc.to_http() from exc
```

- [ ] **Step 2: Write jobs.py router**

```python
# backend/app/api/v1/jobs.py
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.repositories.job_repository import JobRepository
from app.schemas.job import JobCreate, JobRead
from app.services.job_service import JobService
from app.core.exceptions import NotFoundError, AuthorizationError

router = APIRouter(prefix="/jobs", tags=["jobs"])


def _svc(session: AsyncSession = Depends(get_db)) -> JobService:
    return JobService(JobRepository(session))


@router.post("/", response_model=JobRead, status_code=status.HTTP_201_CREATED)
async def create_job(
    data: JobCreate,
    current_user: User = Depends(get_current_user),
    svc: JobService = Depends(_svc),
):
    return await svc.create(current_user.id, data)


@router.get("/", response_model=list[JobRead])
async def list_jobs(
    status_filter: str | None = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    svc: JobService = Depends(_svc),
):
    return await svc.list_for_user(current_user.id, status=status_filter)


@router.get("/{job_id}", response_model=JobRead)
async def get_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    svc: JobService = Depends(_svc),
):
    try:
        return await svc.get_for_user(job_id, current_user.id)
    except (NotFoundError, AuthorizationError) as exc:
        raise exc.to_http() from exc


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    svc: JobService = Depends(_svc),
):
    try:
        await svc.delete(job_id, current_user.id)
    except (NotFoundError, AuthorizationError) as exc:
        raise exc.to_http() from exc
```

- [ ] **Step 3: Write applications.py router**

```python
# backend/app/api/v1/applications.py
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.repositories.application_repository import ApplicationRepository
from app.schemas.application import ApplicationCreate, ApplicationRead, ApplicationDetail
from app.services.application_service import ApplicationService
from app.core.exceptions import NotFoundError, AuthorizationError, ConflictError

router = APIRouter(prefix="/applications", tags=["applications"])


def _svc(session: AsyncSession = Depends(get_db)) -> ApplicationService:
    return ApplicationService(ApplicationRepository(session))


@router.post("/", response_model=ApplicationRead, status_code=status.HTTP_201_CREATED)
async def create_application(
    data: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    svc: ApplicationService = Depends(_svc),
):
    try:
        return await svc.create(current_user.id, data)
    except ConflictError as exc:
        raise exc.to_http() from exc


@router.get("/", response_model=list[ApplicationRead])
async def list_applications(
    current_user: User = Depends(get_current_user),
    svc: ApplicationService = Depends(_svc),
):
    return await svc.list_for_user(current_user.id)


@router.get("/{application_id}", response_model=ApplicationDetail)
async def get_application(
    application_id: str,
    current_user: User = Depends(get_current_user),
    svc: ApplicationService = Depends(_svc),
):
    try:
        return await svc.get_detail(application_id, current_user.id)
    except (NotFoundError, AuthorizationError) as exc:
        raise exc.to_http() from exc
```

- [ ] **Step 4: Update router.py**

```python
# backend/app/api/v1/router.py
from fastapi import APIRouter
from app.api.v1 import auth, users, resumes, jobs, applications

router = APIRouter(prefix="/api/v1")
router.include_router(auth.router)
router.include_router(users.router)
router.include_router(resumes.router)
router.include_router(jobs.router)
router.include_router(applications.router)
```

- [ ] **Step 5: Commit**

```bash
git add backend/app/api/v1/ 
git commit -m "feat: add REST CRUD routers for resumes, jobs, applications"
```

---

## Task 9: Integration tests for jobs API

**Files:**
- Create: `backend/tests/integration/api/test_jobs.py`

- [ ] **Step 1: Write test**

```python
# backend/tests/integration/api/test_jobs.py
import pytest


async def _auth_header(client) -> dict:
    await client.post(
        "/api/v1/auth/register",
        json={"email": "job@test.com", "password": "pass123", "full_name": "Job Tester"},
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "job@test.com", "password": "pass123"},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_create_and_list_jobs(client):
    headers = await _auth_header(client)
    resp = await client.post(
        "/api/v1/jobs/",
        json={"title": "Senior Python Dev", "company": "Acme", "source": "telegram"},
        headers=headers,
    )
    assert resp.status_code == 201
    job = resp.json()
    assert job["title"] == "Senior Python Dev"
    assert job["status"] == "new"

    resp = await client.get("/api/v1/jobs/", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


@pytest.mark.asyncio
async def test_get_job_not_found(client):
    headers = await _auth_header(client)
    resp = await client.get("/api/v1/jobs/nonexistent-id", headers=headers)
    assert resp.status_code == 404
```

- [ ] **Step 2: Run all tests**

```bash
cd backend && SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx DATABASE_URL=postgresql+asyncpg://u:p@h/db REDIS_URL=redis://localhost python -m pytest tests/ -v
```
Expected: all PASS

- [ ] **Step 3: Commit**

```bash
git add backend/tests/integration/api/test_jobs.py
git commit -m "test: add integration tests for jobs API"
```

---

## Phase 2 Complete

All domain models defined, migrated, with full CRUD APIs. The data layer is ready for AI agents (Phase 3) and the frontend (Phase 9).

**Next:** Phase 3 — AI Provider Abstraction Layer (OpenAI, Anthropic, Ollama) + 8 specialized AI Agents.
