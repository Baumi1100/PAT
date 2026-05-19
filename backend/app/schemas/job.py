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
