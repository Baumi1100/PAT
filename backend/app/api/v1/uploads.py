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
from app.repositories.resume_repository import ResumeRepository
from app.schemas.resume import ResumeRead

router = APIRouter(prefix="/uploads", tags=["uploads"])
_dispatcher = DocumentDispatcher()

_ALLOWED_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "image/png",
    "image/jpeg",
    "image/webp",
}


@router.post("/resume", response_model=ResumeRead, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),  # noqa: B008
    current_user: User = Depends(get_current_user),  # noqa: B008
    session: AsyncSession = Depends(get_db),  # noqa: B008
) -> ResumeRead:
    settings = get_settings()

    if file.content_type not in _ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File type '{file.content_type}' not supported.",
        )

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
