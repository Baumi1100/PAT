# backend/app/integrations/telegram/notify.py
"""
Utility for sending analysis-result notifications via Telegram.
Called at the end of the Celery pipeline — fire-and-forget, never raises.
"""
from __future__ import annotations

import logging

logger = logging.getLogger(__name__)


async def send_analysis_result(
    *,
    telegram_chat_id: str,
    job_title: str,
    company: str | None,
    match_score: float,
    strengths: list[str],
    skill_gaps: list[str],
    application_id: str,
    frontend_url: str,
) -> None:
    """
    Send a concise analysis summary to the user's Telegram chat.
    Silently swallows all errors so a notification failure never breaks the pipeline.
    """
    from app.config import get_settings

    settings = get_settings()
    if not settings.telegram_bot_token:
        return
    if not telegram_chat_id:
        return

    try:
        from html import escape

        from telegram import Bot

        score_emoji = "🟢" if match_score >= 75 else "🟡" if match_score >= 50 else "🔴"
        job_label = escape(job_title) + (f" @ {escape(company)}" if company else "")

        # Strengths — max 3 bullets
        strength_lines = "\n".join(f"  • {escape(s)}" for s in strengths[:3])
        strengths_block = f"✅ <b>Stärken:</b>\n{strength_lines}" if strength_lines else ""

        # Skill gaps — max 3 bullets
        gap_lines = "\n".join(f"  • {escape(g)}" for g in skill_gaps[:3])
        gaps_block = f"⚠️ <b>Lücken:</b>\n{gap_lines}" if gap_lines else ""

        body_parts = [p for p in [strengths_block, gaps_block] if p]
        body = "\n\n".join(body_parts)

        link = f"{frontend_url.rstrip('/')}/applications/{application_id}"

        message = (
            f"✅ <b>Analyse abgeschlossen!</b>\n\n"
            f"💼 {job_label}\n\n"
            f"{score_emoji} <b>Match-Score: {int(match_score)}/100</b>\n\n"
            f"{body}\n\n"
            f'<a href="{link}">Details öffnen</a>'
        )

        bot = Bot(token=settings.telegram_bot_token)
        async with bot:
            await bot.send_message(
                chat_id=telegram_chat_id,
                text=message,
                parse_mode="HTML",
                disable_web_page_preview=True,
            )

    except Exception:
        logger.exception(
            "Telegram notification failed for application %s — continuing silently",
            application_id,
        )
