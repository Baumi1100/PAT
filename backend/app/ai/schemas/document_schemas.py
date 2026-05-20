# backend/app/ai/schemas/document_schemas.py
from pydantic import BaseModel, Field


class ResumeSection(BaseModel):
    heading: str
    content: list[str]


class OptimizedResume(BaseModel):
    summary: str
    skills_section: list[str]
    experience_sections: list[ResumeSection]
    keywords_injected: list[str] = Field(default_factory=list)
    ats_score_estimate: float | None = None
    formatting_notes: list[str] = Field(default_factory=list)
    latex_source: str = ""


class CoverLetter(BaseModel):
    subject: str
    salutation: str
    opening_paragraph: str
    body_paragraphs: list[str]
    closing_paragraph: str
    sign_off: str
    full_text: str
    latex_source: str = ""


class InterviewQuestions(BaseModel):
    technical_questions: list[str] = Field(default_factory=list)
    behavioral_questions: list[str] = Field(default_factory=list)
    situational_questions: list[str] = Field(default_factory=list)
    company_specific_questions: list[str] = Field(default_factory=list)
    questions_to_ask_interviewer: list[str] = Field(default_factory=list)


class ATSKeywordAnalysis(BaseModel):
    high_priority_keywords: list[str] = Field(default_factory=list)
    medium_priority_keywords: list[str] = Field(default_factory=list)
    keywords_present_in_resume: list[str] = Field(default_factory=list)
    keywords_missing_from_resume: list[str] = Field(default_factory=list)
    keyword_density_score: float = Field(ge=0.0, le=100.0, default=0.0)
