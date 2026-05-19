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
    created_at: datetime

    model_config = {"from_attributes": True}
