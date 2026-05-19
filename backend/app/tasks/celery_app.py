# backend/app/tasks/celery_app.py
from celery import Celery

from app.config import get_settings


def _make_celery() -> Celery:
    s = get_settings()
    app = Celery(
        "pat",
        broker=s.redis_url,
        backend=s.redis_url,
        include=[
            "app.tasks.analyze_job",
            "app.tasks.analyze_resume",
            "app.tasks.generate_application",
        ],
    )
    app.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
        task_track_started=True,
        task_acks_late=True,
        worker_prefetch_multiplier=1,
    )
    return app


celery_app = _make_celery()
