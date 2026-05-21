# backend/app/ai/agents/tex_keyword_injector.py
"""Injects ATS keywords into an existing LaTeX resume source.

The original .tex is returned unchanged except for minimal, natural keyword
additions at semantically appropriate locations. Structure, style, and all
existing content are preserved exactly.
"""

import re

from pydantic import BaseModel

from app.ai.agents.base_agent import BaseAgent


class InjectedTex(BaseModel):
    latex_source: str


def _restore_unicode(text: str) -> str:
    """Convert any literal \\uXXXX sequences back to real Unicode characters.

    Some LLMs emit \\u00fc instead of ü when producing JSON payloads. After
    json.loads the escape survives as a six-character literal; this pass
    converts it back to the proper character so the LaTeX compiles correctly.
    """
    return re.sub(r"\\u([0-9a-fA-F]{4})", lambda m: chr(int(m.group(1), 16)), text)


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
        "7. Preserve ALL non-ASCII characters (ä, ö, ü, ß, é, etc.) exactly as they "
        "appear in the input. Do NOT replace them with \\uXXXX escape sequences or any "
        "other encoding — output them as literal UTF-8 characters.\n"
        "8. Return ONLY the LaTeX source inside the latex_source field — no explanations, "
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
        latex = result.latex_source or original_tex
        return _restore_unicode(latex)
