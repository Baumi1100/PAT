# backend/app/schemas/work_certificate.py
from datetime import datetime

from pydantic import BaseModel


class WorkCertificateRead(BaseModel):
    id: str
    user_id: str
    title: str
    file_name: str | None
    file_type: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
