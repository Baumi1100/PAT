# backend/app/integrations/telegram/handlers.py
import os
import tempfile
import httpx
from telegram import Update
from telegram.ext import ContextTypes
from app.integrations.telegram.url_extractor import extract_urls, fetch_job_text_from_url
from app.document_processing.dispatcher import DocumentDispatcher

_dispatcher = DocumentDispatcher()


async def handle_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        "👋 Welcome to PAT — Personal Application Tracker!\n\n"
        "Send me:\n"
        "• A job posting URL\n"
        "• A copied job description (text)\n"
        "• A PDF or DOCX of the job posting\n"
        "• A screenshot of the job posting\n\n"
        "I'll analyze it and compare it with your resume."
    )


async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    text = update.message.text or ""
    chat_id = str(update.effective_chat.id)

    urls = extract_urls(text)
    if urls:
        await update.message.reply_text(f"🔍 Fetching job from {urls[0]}...")
        try:
            job_text = await fetch_job_text_from_url(urls[0])
            await _submit_job(chat_id, job_text, source="telegram_url", url=urls[0], context=context)
        except Exception as exc:
            await update.message.reply_text(f"❌ Could not fetch URL: {exc}")
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
        await context.bot.send_message(
            chat_id,
            f"✅ Job saved! Analysis starting...\n"
            f"Check the dashboard for results: job ID `{job_id}`",
            parse_mode="Markdown",
        )
