# backend/app/ai/agents/certificate_parser.py
from app.ai.agents.base_agent import BaseAgent
from app.ai.schemas.certificate_schemas import ParsedWorkCertificate


class CertificateParserAgent(BaseAgent):
    task_type = "resume_parsing"
    system_prompt = (
        "You are an expert at parsing German Arbeitszeugnisse (employment references). "
        "Extract all structured information from the certificate text provided.\n"
        "Rules:\n"
        "1. Identify company, job title, and exact employment dates.\n"
        "2. Extract all mentioned responsibilities as concise action phrases.\n"
        "3. Identify achievements — quantified results, projects, improvements.\n"
        "4. Capture the performance rating phrase verbatim "
        "(e.g. 'stets zu unserer vollsten Zufriedenheit').\n"
        "5. List any technologies, tools, or methodologies explicitly mentioned.\n"
        "6. Extract soft skills praised (leadership, communication, reliability, etc.).\n"
        "7. Note leadership indicators: team size managed, budget responsibility, "
        "mentoring mentioned.\n"
        "8. If the certificate is in German, still extract all fields — keep "
        "responsibilities/achievements in the original language."
    )

    async def parse(
        self,
        certificate_text: str,
        user_provider: str | None = None,
        user_model: str | None = None,
    ) -> ParsedWorkCertificate:
        return await self._call(
            user_message=f"Parse this Arbeitszeugnis:\n\n{certificate_text}",
            output_schema=ParsedWorkCertificate,
            user_provider=user_provider,
            user_model=user_model,
        )
