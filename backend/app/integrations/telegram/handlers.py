# backend/app/integrations/telegram/handlers.py
import os
import tempfile

import httpx
from telegram import Update
from telegram.ext import ContextTypes

from app.document_processing.dispatcher import DocumentDispatcher
from app.integrations.telegram.url_extractor import extract_urls, fetch_job_text_from_url

_dispatcher = DocumentDispatcher()


async def handle_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = str(update.effective_chat.id)
    await update.message.reply_text(
        "👋 Welcome to PAT — Personal Application Tracker!\n\n"
        f"Your Telegram Chat ID: `{chat_id}`\n\n"
        "To link this account, go to Settings in the web app and enter your Chat ID.\n\n"
        "Once linked, send me:\n"
        "• A job posting URL\n"
        "• A copied job description (text)\n"
        "• A PDF or DOCX of the job posting\n"
        "• A screenshot of the job posting",
        parse_mode="Markdown",
    )


async def handle_myid(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = str(update.effective_chat.id)
    await update.message.reply_text(
        f"Your Telegram Chat ID is: `{chat_id}`\n\n"
        "Copy this and paste it in Settings → Telegram in the PAT web app.",
        parse_mode="Markdown",
    )


async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    text = update.message.text or ""
    chat_id = str(update.effective_chat.id)

    urls = extract_urls(text)
    if urls:
        await update.message.reply_text(f"🔍 Fetching job from {urls[0]}...")
        try:
            job_text = await fetch_job_text_from_url(urls[0])
            await _submit_job(
                chat_id, job_text, source="telegram_url", url=urls[0], context=context
            )
        except Exception as exc:
            msg = str(exc)
            if "403" in msg or "Forbidden" in msg:
                await update.message.reply_text(
                    "❌ Diese Seite blockiert automatische Zugriffe (z.B. Indeed).\n\n"
                    "Kopiere den Stellentext direkt aus der Anzeige "
                    "und schicke ihn mir als Nachricht."
                )
            elif "404" in msg or "Not Found" in msg:
                await update.message.reply_text(
                    "❌ Stellenanzeige nicht gefunden (404). "
                    "Möglicherweise wurde sie bereits entfernt."
                )
            else:
                await update.message.reply_text(f"❌ URL konnte nicht geladen werden: {exc}")
        return

    if len(text) > 100:
        await update.message.reply_text("📋 Processing job description...")
        await _submit_job(chat_id, text, source="telegram_text", context=context)
    else:
        await update.message.reply_text(
            "Please send a job URL, paste the full job description, or upload a file."
        )


async def handle_document(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    doc = update.message.document
    chat_id = str(update.effective_chat.id)

    if doc.file_size > 10 * 1024 * 1024:
        await update.message.reply_text("❌ File too large. Max 10MB.")
        return

    await update.message.reply_text("📄 Processing document...")
    file = await context.bot.get_file(doc.file_id)
    ext = os.path.splitext(doc.file_name or "file.pdf")[1].lower() or ".pdf"

    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        await file.download_to_drive(tmp.name)
        try:
            result = _dispatcher.process(tmp.name)
            await _submit_job(chat_id, result.text, source="telegram_document", context=context)
        finally:
            os.unlink(tmp.name)


async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = str(update.effective_chat.id)
    photo = update.message.photo[-1]
    await update.message.reply_text("🖼️ Running OCR on image...")
    file = await context.bot.get_file(photo.file_id)

    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        await file.download_to_drive(tmp.name)
        try:
            result = _dispatcher.process(tmp.name)
            if len(result.text) < 50:
                await update.message.reply_text(
                    "❌ Could not extract text from image. Try sending the job as text or PDF."
                )
                return
            await _submit_job(chat_id, result.text, source="telegram_photo", context=context)
        finally:
            os.unlink(tmp.name)


async def _submit_job(
    chat_id: str,
    job_text: str,
    source: str,
    url: str | None = None,
    context: ContextTypes.DEFAULT_TYPE | None = None,
) -> None:
    """Posts job to backend API and triggers analysis pipeline."""
    from app.config import get_settings

    settings = get_settings()
    backend_url = getattr(settings, "backend_internal_url", "http://backend:8000")

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{backend_url}/api/v1/auth/telegram-login",
            json={"telegram_chat_id": chat_id},
        )
        if resp.status_code != 200:
            await context.bot.send_message(
                chat_id,
                "❌ Your Telegram account is not linked to a PAT account. "
                "Log in to the web app and link your Telegram in Settings.",
            )
            return

        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        job_resp = await client.post(
            f"{backend_url}/api/v1/jobs/",
            json={"title": "Job from Telegram", "raw_text": job_text, "source": source, "url": url},
            headers=headers,
        )
        if job_resp.status_code != 201:
            await context.bot.send_message(chat_id, "❌ Failed to save job. Try again.")
            return

        job_id = job_resp.json()["id"]

        analyze_resp = await client.post(
            f"{backend_url}/api/v1/jobs/{job_id}/analyze",
            headers=headers,
        )
        if analyze_resp.status_code == 202:
            app_id = analyze_resp.json().get("application_id", "")
            await context.bot.send_message(
                chat_id,
                f"✅ Job saved and analysis started!\n"
                f"Check the web app for results — this takes about 30–60 seconds.\n"
                f"Application ID: `{app_id}`",
                parse_mode="Markdown",
            )
        elif analyze_resp.status_code == 400:
            await context.bot.send_message(
                chat_id,
                "✅ Job saved, but no resume found.\n"
                "Upload your resume in the web app (Resumes page), then the analysis will run.",
            )
        else:
            await context.bot.send_message(
                chat_id,
                f"✅ Job saved (ID: `{job_id}`), but analysis could not start. "
                "Try triggering it from the web app.",
                parse_mode="Markdown",
            )
