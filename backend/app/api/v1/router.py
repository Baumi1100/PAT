# backend/app/api/v1/router.py
from fastapi import APIRouter

from app.api.v1 import (
    applications,
    auth,
    certificates,
    exports,
    health,
    jobs,
    resumes,
    uploads,
    users,
)

router = APIRouter(prefix="/api/v1")
router.include_router(auth.router)
router.include_router(users.router)
router.include_router(resumes.router)
router.include_router(jobs.router)
router.include_router(applications.router)
router.include_router(certificates.router)
router.include_router(health.router)
router.include_router(uploads.router)
router.include_router(exports.router)
