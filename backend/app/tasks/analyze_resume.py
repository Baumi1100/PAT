# backend/app/tasks/analyze_resume.py
from app.tasks.celery_app import celery_app


@celery_app.task(bind=True, name="tasks.analyze_resume", max_retries=3)
def analyze_resume_task(self, resume_id: str, user_id: str) -> dict:
    return {"resume_id": resume_id, "status": "queued"}
