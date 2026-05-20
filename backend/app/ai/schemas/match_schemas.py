# backend/app/ai/schemas/match_schemas.py
from pydantic import BaseModel, Field


class SkillMatch(BaseModel):
    skill: str
    matched: bool
    similarity_score: float = 0.0
    notes: str | None = None


class MatchResult(BaseModel):
    overall_score: float = Field(ge=0.0, le=100.0)
    skill_score: float = Field(ge=0.0, le=100.0)
    experience_score: float = Field(ge=0.0, le=100.0)
    keyword_score: float = Field(ge=0.0, le=100.0)
    seniority_match: bool = False
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    skill_matches: list[SkillMatch] = Field(default_factory=list)
    summary: str = ""


class SkillGapReport(BaseModel):
    critical_gaps: list[str] = Field(default_factory=list)
    optional_gaps: list[str] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)
    learning_resources: list[str] = Field(default_factory=list)
    estimated_gap_closure_weeks: int | None = None
