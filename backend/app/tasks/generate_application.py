# backend/app/tasks/generate_application.py
from app.tasks.celery_app import celery_app


@celery_app.task(bind=True, name="tasks.generate_application", max_retries=3)
def generate_application_task(self, job_id: str, resume_id: str, user_id: str) -> dict:
    return {"job_id": job_id, "resume_id": resume_id, "status": "queued"}
