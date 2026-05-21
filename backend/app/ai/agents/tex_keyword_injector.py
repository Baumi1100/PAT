# backend/app/ai/agents/tex_keyword_injector.py
"""Injects ATS keywords into an existing LaTeX resume source.

The original .tex is returned unchanged except for minimal, natural keyword
additions at semantically appropriate locations. Structure, style, and all
existing content are preserved exactly.
"""

from pydantic import BaseModel

from app.ai.agents.base_agent import BaseAgent


class InjectedTex(BaseModel):
    latex_source: str


class TexKeywordInjectorAgent(BaseAgent):
    task_type = "tex_keyword_injection"
    system_prompt = (
        "You are a LaTeX resume editor. Your ONLY task is to inject missing ATS keywords "
        "into an existing LaTeX resume — nothing else.\n\n"
        "Strict rules:\n"
        "1. Return the COMPLETE original LaTeX source. Every line that did not need a "
        "change must appear exactly as in the input.\n"
        "2. Do NOT change the document class, packages, style, colors, fonts, or any "
        "formatting commands.\n"
        "3. Do NOT add new sections, new \\cventry blocks, new \\item entries, or any "
        "structural elements.\n"
        "4. Do NOT remove or reorder anything.\n"
        "5. Only inject missing keywords by:\n"
        "   a) Appending them naturally to an existing comma-separated skill/technology "
        "list (e.g. \\cvitem{Technologien}{...}) if the keyword fits the category.\n"
        "   b) Weaving a keyword into an existing bullet point where it genuinely "
        "describes what is already stated — no new claims.\n"
        "6. If a keyword cannot be added naturally without fabricating information, "
        "skip it entirely.\n"
        "7. Return ONLY the LaTeX source inside the latex_source field — no explanations, "
        "no markdown fences, no commentary."
    )

    async def inject(
        self,
        original_tex: str,
        missing_keywords: list[str],
        user_provider: str | None = None,
        user_model: str | None = None,
    ) -> str:
        if not missing_keywords:
            return original_tex

        message = (
            f"Missing ATS keywords to inject (only where they fit naturally):\n"
            f"{', '.join(missing_keywords)}\n\n"
            f"Original LaTeX source:\n"
            f"```latex\n{original_tex}\n```"
        )

        result = await self._call(
            user_message=message,
            output_schema=InjectedTex,
            user_provider=user_provider,
            user_model=user_model,
            max_tokens=16000,
        )
        return result.latex_source or original_tex
