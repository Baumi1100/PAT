# backend/app/ai/schemas/job_schemas.py
from pydantic import BaseModel, Field


class ParsedJob(BaseModel):
    title: str | None = None
    company: str | None = None
    location: str | None = None
    employment_type: str | None = None
    must_have_skills: list[str] = Field(default_factory=list)
    nice_to_have_skills: list[str] = Field(default_factory=list)
    ats_keywords: list[str] = Field(default_factory=list)
    technologies: list[str] = Field(default_factory=list)
    seniority_level: str | None = None
    requires_leadership: bool = False
    industry: str | None = None
    min_years_experience: int | None = None
    salary_range: str | None = None
    remote_policy: str | None = None
    responsibilities: list[str] = Field(default_factory=list)
    benefits: list[str] = Field(default_factory=list)
    company_description: str | None = None
