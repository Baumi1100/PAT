# backend/app/schemas/job.py
from datetime import datetime

from pydantic import BaseModel


class JobCreate(BaseModel):
    title: str = "Job from Telegram"
    company: str | None = None
    location: str | None = None
    url: str | None = None
    raw_text: str | None = None
    source: str = "manual"
    source_platform: str | None = None


class JobUpdate(BaseModel):
    title: str | None = None
    company: str | None = None
    location: str | None = None
    status: str | None = None
    priority: str | None = None
    notes: str | None = None
    contact_person: str | None = None
    applied_at: datetime | None = None
    salary_range: str | None = None
    remote_policy: str | None = None
    employment_type: str | None = None


class JobRead(BaseModel):
    id: str
    user_id: str
    title: str
    company: str | None
    location: str | None
    url: str | None
    source: str
    source_platform: str | None
    status: str
    match_score: float | None = None
    # AI-extracted
    salary_range: str | None
    remote_policy: str | None
    employment_type: str | None
    seniority_level: str | None
    # Tracking
    priority: str | None
    notes: str | None
    contact_person: str | None
    applied_at: datetime | None
    created_at: datetime
    raw_text: str | None = None

    model_config = {"from_attributes": True}
