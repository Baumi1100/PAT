# backend/app/ai/schemas/resume_schemas.py
from pydantic import BaseModel, Field


class WorkExperience(BaseModel):
    company: str
    title: str
    start_date: str
    end_date: str | None = None
    is_current: bool = False
    responsibilities: list[str] = Field(default_factory=list)
    achievements: list[str] = Field(default_factory=list)
    technologies: list[str] = Field(default_factory=list)


class Education(BaseModel):
    institution: str
    degree: str
    field: str | None = None
    graduation_year: int | None = None


class Certification(BaseModel):
    name: str
    issuer: str | None = None
    year: int | None = None


class ParsedResume(BaseModel):
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    summary: str | None = None
    skills: list[str] = Field(default_factory=list)
    technologies: list[str] = Field(default_factory=list)
    soft_skills: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)
    work_experience: list[WorkExperience] = Field(default_factory=list)
    education: list[Education] = Field(default_factory=list)
    certifications: list[Certification] = Field(default_factory=list)
    seniority_level: str | None = None
    has_leadership: bool = False
    years_of_experience: float | None = None
    industries: list[str] = Field(default_factory=list)
    projects: list[str] = Field(default_factory=list)
