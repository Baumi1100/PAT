# backend/app/api/v1/exports.py
import json
import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import get_settings
from app.database import get_db
from app.dependencies import get_current_user
from app.document_processing.latex_renderer import LatexRenderer
from app.models.user import User
from app.repositories.application_repository import ApplicationRepository
from app.services.application_service import ApplicationService

router = APIRouter(prefix="/applications", tags=["exports"])
_renderer = LatexRenderer()


def _svc(session: AsyncSession = Depends(get_db)) -> ApplicationService:  # noqa: B008
    return ApplicationService(ApplicationRepository(session))


@router.get("/{application_id}/export/resume.tex")
async def export_resume_tex(
    application_id: str,
    current_user: User = Depends(get_current_user),  # noqa: B008
    svc: ApplicationService = Depends(_svc),  # noqa: B008
) -> Response:
    latex = await _get_latex(application_id, current_user.id, "resume", svc)
    filename = f"resume_{application_id[:8]}.tex"
    return Response(
        content=latex,
        media_type="application/x-tex",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{application_id}/export/resume.pdf")
async def export_resume_pdf(
    application_id: str,
    current_user: User = Depends(get_current_user),  # noqa: B008
    svc: ApplicationService = Depends(_svc),  # noqa: B008
) -> Response:
    latex = await _get_latex(application_id, current_user.id, "resume", svc)
    pdf = _compile(latex)
    filename = f"resume_{application_id[:8]}.pdf"
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{application_id}/export/cover_letter.tex")
async def export_cover_letter_tex(
    application_id: str,
    current_user: User = Depends(get_current_user),  # noqa: B008
    svc: ApplicationService = Depends(_svc),  # noqa: B008
) -> Response:
    latex = await _get_latex(application_id, current_user.id, "cover_letter", svc)
    filename = f"cover_letter_{application_id[:8]}.tex"
    return Response(
        content=latex,
        media_type="application/x-tex",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{application_id}/export/cover_letter.pdf")
async def export_cover_letter_pdf(
    application_id: str,
    current_user: User = Depends(get_current_user),  # noqa: B008
    svc: ApplicationService = Depends(_svc),  # noqa: B008
) -> Response:
    latex = await _get_latex(application_id, current_user.id, "cover_letter", svc)
    pdf = _compile(latex)
    filename = f"cover_letter_{application_id[:8]}.pdf"
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


async def _get_latex(
    application_id: str, user_id: str, doc_type: str, svc: ApplicationService
) -> str:
    app = await svc.get_for_user(application_id, user_id)

    if doc_type == "resume":
        if not app.optimized_resume:
            raise HTTPException(status_code=404, detail="Optimized resume not yet generated")
        data = json.loads(app.optimized_resume)
        latex = data.get("latex_source", "")
    else:  # cover_letter
        if not app.cover_letter:
            raise HTTPException(status_code=404, detail="Cover letter not yet generated")
        try:
            data = json.loads(app.cover_letter)
            latex = data.get("latex_source", "")
        except json.JSONDecodeError:
            latex = ""

    if not latex:
        raise HTTPException(
            status_code=404,
            detail=f"No LaTeX source available for {doc_type}. "
                   "Ensure the application analysis has completed.",
        )
    return latex


def _compile(latex: str) -> bytes:
    try:
        return _renderer.compile(latex)
    except (ValueError, RuntimeError) as exc:
        raise HTTPException(status_code=500, detail=f"LaTeX compilation failed: {exc}") from exc
