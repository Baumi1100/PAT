# backend/app/integrations/telegram/bot.py
from telegram.ext import Application, CommandHandler, MessageHandler, filters
from app.config import get_settings
from app.integrations.telegram.handlers import (
    handle_start,
    handle_text,
    handle_document,
    handle_photo,
)


def create_bot_application() -> Application:
    settings = get_settings()
    if not settings.telegram_bot_token:
        raise ValueError("TELEGRAM_BOT_TOKEN not configured")

    app = Application.builder().token(settings.telegram_bot_token).build()
    app.add_handler(CommandHandler("start", handle_start))
    app.add_handler(MessageHandler(filters.PHOTO, handle_photo))
    app.add_handler(MessageHandler(filters.Document.ALL, handle_document))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    return app


if __name__ == "__main__":
    bot_app = create_bot_application()
    bot_app.run_polling(drop_pending_updates=True)
