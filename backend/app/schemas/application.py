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
