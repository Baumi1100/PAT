# backend/app/tasks/analyze_job.py
from app.tasks.celery_app import celery_app


@celery_app.task(bind=True, name="tasks.analyze_job", max_retries=3)
def analyze_job_task(self, job_id: str, user_id: str) -> dict:
    # Phase 5 implements the AI agent pipeline
    return {"job_id": job_id, "status": "queued"}
