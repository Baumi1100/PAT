# backend/app/ai/agents/interview_questions.py
from app.ai.agents.base_agent import BaseAgent
from app.ai.schemas.document_schemas import InterviewQuestions
from app.ai.schemas.job_schemas import ParsedJob
from app.ai.schemas.match_schemas import MatchResult
from app.ai.schemas.resume_schemas import ParsedResume


class InterviewQuestionsAgent(BaseAgent):
    task_type = "interview_questions"
    system_prompt = (
        "You are a senior technical interviewer preparing a candidate for a job interview. "
        "Generate interview questions tailored to the specific role and candidate profile. "
        "technical_questions: deep technical questions for skills required by this role. "
        "behavioral_questions: STAR-format behavioral questions targeting the job's requirements. "
        "situational_questions: scenario-based questions relevant to this role. "
        "company_specific_questions: questions about the company's known domain/products. "
        "questions_to_ask_interviewer: smart questions the candidate should ask. "
        "Generate 4-6 questions per category."
    )

    async def generate(
        self,
        resume: ParsedResume,
        job: ParsedJob,
        match_result: MatchResult,
        user_provider: str | None = None,
        user_model: str | None = None,
    ) -> InterviewQuestions:
        message = (
            f"Role: {job.title} at {job.company}\n"
            f"Key technologies required: {job.technologies[:10]}\n"
            f"Candidate weaknesses identified: {match_result.weaknesses}\n"
            f"Candidate strengths: {match_result.strengths}\n"
            f"Candidate seniority: {resume.seniority_level}\n"
            f"Has leadership: {resume.has_leadership}\n"
            f"Job requires leadership: {job.requires_leadership}"
        )
        return await self._call(
            user_message=message,
            output_schema=InterviewQuestions,
            user_provider=user_provider,
            user_model=user_model,
        )
