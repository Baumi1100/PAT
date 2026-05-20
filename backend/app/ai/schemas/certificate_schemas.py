# backend/app/ai/schemas/certificate_schemas.py
from pydantic import BaseModel, Field


class ParsedWorkCertificate(BaseModel):
    """Structured data extracted from a German Arbeitszeugnis."""

    company: str | None = None
    title: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    responsibilities: list[str] = Field(default_factory=list)
    achievements: list[str] = Field(default_factory=list)
    # German performance phrases like "stets zu unserer vollsten Zufriedenheit"
    performance_rating: str | None = None
    technologies: list[str] = Field(default_factory=list)
    soft_skills: list[str] = Field(default_factory=list)
    # Evidence of leadership: team size, budget ownership, etc.
    leadership_indicators: list[str] = Field(default_factory=list)
    industry: str | None = None
