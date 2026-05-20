# backend/app/api/v1/uploads.py
import os
import uuid

import aiofiles
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.dependencies import get_current_user
from app.document_processing.dispatcher import DocumentDispatcher
from app.models.resume import Resume
from app.models.user import User
from app.models.work_certificate import WorkCertificate
from app.repositories.resume_repository import ResumeRepository
from app.repositories.work_certificate_repository import WorkCertificateRepository
from app.schemas.resume import ResumeRead
from app.schemas.work_certificate import WorkCertificateRead

router = APIRouter(prefix="/uploads", tags=["uploads"])
_dispatcher = DocumentDispatcher()

_ALLOWED_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/x-tex",
    "application/x-latex",
    "text/x-tex",
    "application/octet-stream",  # browsers sometimes send .tex with this type
    "image/png",
    "image/jpeg",
    "image/webp",
}

_ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt", ".tex", ".png", ".jpg", ".jpeg", ".webp"}


def _check_file_type(file: UploadFile) -> None:
    ext = os.path.splitext(file.filename or "")[1].lower()
    if file.content_type in _ALLOWED_TYPES or ext in _ALLOWED_EXTENSIONS:
        return
    raise HTTPException(
        status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
        detail=f"File type '{file.content_type}' / extension '{ext}' not supported.",
    )


@router.post("/resume", response_model=ResumeRead, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),  # noqa: B008
    current_user: User = Depends(get_current_user),  # noqa: B008
    session: AsyncSession = Depends(get_db),  # noqa: B008
) -> Resume:
    settings = get_settings()

    _check_file_type(file)

    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > settings.max_upload_size_mb:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Max {settings.max_upload_size_mb}MB.",
        )

    # Save to disk
    os.makedirs(settings.upload_dir, exist_ok=True)
    ext = os.path.splitext(file.filename or "resume.pdf")[1].lower() or ".pdf"
    saved_name = f"{current_user.id}_{uuid.uuid4().hex}{ext}"
    saved_path = os.path.join(settings.upload_dir, saved_name)
    async with aiofiles.open(saved_path, "wb") as f:
        await f.write(content)

    # Parse text
    try:
        result = _dispatcher.process(saved_path)
        raw_text = result.text
    except Exception as exc:
        os.unlink(saved_path)
        raise HTTPException(status_code=422, detail=f"Could not parse file: {exc}") from exc

    repo = ResumeRepository(session)
    resume = Resume(
        user_id=current_user.id,
        title=file.filename or "Uploaded Resume",
        raw_text=raw_text,
        file_path=saved_path,
        file_name=file.filename,
        file_type=ext.lstrip("."),
    )
    return await repo.save(resume)


@router.post(
    "/certificate", response_model=WorkCertificateRead, status_code=status.HTTP_201_CREATED
)
async def upload_certificate(
    file: UploadFile = File(...),  # noqa: B008
    current_user: User = Depends(get_current_user),  # noqa: B008
    session: AsyncSession = Depends(get_db),  # noqa: B008
) -> WorkCertificate:
    settings = get_settings()

    _check_file_type(file)

    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > settings.max_upload_size_mb:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Max {settings.max_upload_size_mb}MB.",
        )

    os.makedirs(settings.upload_dir, exist_ok=True)
    ext = os.path.splitext(file.filename or "certificate.pdf")[1].lower() or ".pdf"
    saved_name = f"{current_user.id}_cert_{uuid.uuid4().hex}{ext}"
    saved_path = os.path.join(settings.upload_dir, saved_name)
    async with aiofiles.open(saved_path, "wb") as f:
        await f.write(content)

    try:
        result = _dispatcher.process(saved_path)
        raw_text = result.text
    except Exception as exc:
        os.unlink(saved_path)
        raise HTTPException(status_code=422, detail=f"Could not parse file: {exc}") from exc

    repo = WorkCertificateRepository(session)
    cert = WorkCertificate(
        user_id=current_user.id,
        title=file.filename or "Arbeitszeugnis",
        raw_text=raw_text,
        file_path=saved_path,
        file_name=file.filename,
        file_type=ext.lstrip("."),
    )
    return await repo.save(cert)
