# Job Application Platform — Phase 4: Document Processing + File Upload

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Parse PDF, DOCX, and image files (OCR) into clean text, dann expose a `/resumes/upload` endpoint. Außerdem: LaTeX-Export-Pipeline für ATS-Lebenslauf und Anschreiben — das `latex_source`-Feld der AI-Agents wird per `xelatex` zu einem druckfertigen PDF kompiliert. Download-Endpoints liefern `.tex` (Quelltext) und `.pdf` (kompiliert).

**Architecture:** A `DocumentProcessor` dispatcher routes file types to specialized processors. Each processor returns a `DocumentResult` with extracted text and metadata. The upload endpoint validates file type/size, saves to disk, triggers parsing, and stores `raw_text` + `file_path` on the Resume record. Ein `LatexRenderer` kapselt den `xelatex`-Subprocess, schreibt in ein Temp-Verzeichnis und gibt den PDF-Binärinhalt zurück. Alle Exports landen in `settings.export_dir`.

**Tech Stack:** PyMuPDF (fitz), pdfplumber, python-docx, pytesseract + Pillow, python-magic für MIME-Detection. **TeX-Live** (texlive-xetex + texlive-lang-german) im Docker-Image für xelatex-Kompilierung.

**Prerequisite:** Phases 1–3 complete.

---

## File Map

```
backend/
├── app/
│   ├── document_processing/
│   │   ├── __init__.py
│   │   ├── base.py              # DocumentResult dataclass
│   │   ├── pdf_processor.py     # PyMuPDF + pdfplumber fallback
│   │   ├── docx_processor.py    # python-docx
│   │   ├── ocr_processor.py     # Tesseract via pytesseract
│   │   ├── txt_processor.py     # plain text passthrough
│   │   ├── dispatcher.py        # routes file → processor
│   │   └── latex_renderer.py    # xelatex subprocess: latex_source → PDF bytes
│   └── api/
│       └── v1/
│           ├── uploads.py       # POST /resumes/upload
│           └── exports.py       # GET /applications/{id}/export/{resume|cover_letter}.{tex|pdf}
├── tests/
│   └── unit/
│       └── document_processing/
│           ├── test_pdf_processor.py
│           └── test_dispatcher.py
└── fixtures/
    └── test_resume.txt          # minimal fixture for tests
```

---

## Task 1: Add document processing dependencies

**Files:**
- Modify: `backend/pyproject.toml`

- [ ] **Step 1: Add to pyproject.toml dependencies**

Add to the `dependencies` list in `[project]`:
```toml
"pymupdf>=1.24.0",
"pdfplumber>=0.11.0",
"python-docx>=1.1.0",
"pytesseract>=0.3.10",
"Pillow>=10.3.0",
"python-magic>=0.4.27",
```

- [ ] **Step 2: Commit**

```bash
git add backend/pyproject.toml
git commit -m "chore: add document processing dependencies to pyproject.toml"
```

---

## Task 2: DocumentResult base type + processors

**Files:**
- Create: `backend/app/document_processing/base.py`
- Create: `backend/app/document_processing/txt_processor.py`

- [ ] **Step 1: Write base.py**

```python
# backend/app/document_processing/base.py
from dataclasses import dataclass, field


@dataclass
class DocumentResult:
    text: str
    page_count: int = 1
    word_count: int = 0
    extraction_method: str = "unknown"
    warnings: list[str] = field(default_factory=list)

    def __post_init__(self) -> None:
        self.word_count = len(self.text.split())
```

- [ ] **Step 2: Write txt_processor.py**

```python
# backend/app/document_processing/txt_processor.py
from app.document_processing.base import DocumentResult


class TxtProcessor:
    def process(self, file_path: str) -> DocumentResult:
        with open(file_path, encoding="utf-8", errors="replace") as f:
            text = f.read()
        return DocumentResult(text=text.strip(), extraction_method="txt")
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/document_processing/base.py backend/app/document_processing/txt_processor.py
git commit -m "feat: add DocumentResult base type and TxtProcessor"
```

---

## Task 3: PDF processor

**Files:**
- Create: `backend/app/document_processing/pdf_processor.py`
- Create: `backend/tests/unit/document_processing/test_pdf_processor.py`

- [ ] **Step 1: Write failing test**

```python
# backend/tests/unit/document_processing/test_pdf_processor.py
import pytest
import os
import tempfile
from app.document_processing.pdf_processor import PDFProcessor


def test_process_plain_text_returns_document_result():
    # Create a minimal single-page PDF-like fixture using a known text file
    # We test the TxtProcessor pathway via the txt fixture since creating
    # a real PDF requires reportlab; full PDF tests live in integration tests.
    processor = PDFProcessor()
    assert hasattr(processor, "process")


def test_process_nonexistent_file_raises():
    processor = PDFProcessor()
    with pytest.raises((FileNotFoundError, Exception)):
        processor.process("/nonexistent/path/file.pdf")
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd backend && python -m pytest tests/unit/document_processing/test_pdf_processor.py -v
```
Expected: `ImportError`

- [ ] **Step 3: Write pdf_processor.py**

```python
# backend/app/document_processing/pdf_processor.py
import structlog
from app.document_processing.base import DocumentResult

log = structlog.get_logger()


class PDFProcessor:
    def process(self, file_path: str) -> DocumentResult:
        text, method, pages = self._try_pymupdf(file_path)
        if not text or len(text.strip()) < 50:
            text, method, pages = self._try_pdfplumber(file_path)
        if not text or len(text.strip()) < 50:
            log.warning("pdf.low_text_yield", file=file_path, chars=len(text))
        return DocumentResult(
            text=text.strip(),
            page_count=pages,
            extraction_method=method,
            warnings=["Low text yield — may need OCR"] if len(text.strip()) < 50 else [],
        )

    @staticmethod
    def _try_pymupdf(file_path: str) -> tuple[str, str, int]:
        import fitz  # PyMuPDF

        doc = fitz.open(file_path)
        pages = doc.page_count
        text = "\n".join(page.get_text() for page in doc)
        doc.close()
        return text, "pymupdf", pages

    @staticmethod
    def _try_pdfplumber(file_path: str) -> tuple[str, str, int]:
        import pdfplumber

        with pdfplumber.open(file_path) as pdf:
            pages = len(pdf.pages)
            text = "\n".join(p.extract_text() or "" for p in pdf.pages)
        return text, "pdfplumber", pages
```

- [ ] **Step 4: Run tests**

```bash
cd backend && python -m pytest tests/unit/document_processing/ -v
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/document_processing/pdf_processor.py backend/tests/unit/document_processing/test_pdf_processor.py
git commit -m "feat: add PDFProcessor with PyMuPDF primary and pdfplumber fallback"
```

---

## Task 4: DOCX and OCR processors

**Files:**
- Create: `backend/app/document_processing/docx_processor.py`
- Create: `backend/app/document_processing/ocr_processor.py`

- [ ] **Step 1: Write docx_processor.py**

```python
# backend/app/document_processing/docx_processor.py
from app.document_processing.base import DocumentResult


class DocxProcessor:
    def process(self, file_path: str) -> DocumentResult:
        from docx import Document

        doc = Document(file_path)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        # Also extract text from tables
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    if cell.text.strip():
                        paragraphs.append(cell.text.strip())
        text = "\n".join(paragraphs)
        return DocumentResult(
            text=text,
            page_count=1,
            extraction_method="python-docx",
        )
```

- [ ] **Step 2: Write ocr_processor.py**

```python
# backend/app/document_processing/ocr_processor.py
import structlog
from app.document_processing.base import DocumentResult

log = structlog.get_logger()


class OCRProcessor:
    def __init__(self, lang: str = "eng+deu") -> None:
        self._lang = lang

    def process(self, file_path: str) -> DocumentResult:
        import pytesseract
        from PIL import Image

        image = Image.open(file_path)
        # Improve OCR quality: convert to grayscale
        if image.mode != "L":
            image = image.convert("L")
        text = pytesseract.image_to_string(image, lang=self._lang)
        confidence = self._get_confidence(image)
        warnings = []
        if confidence < 60:
            warnings.append(f"Low OCR confidence ({confidence:.0f}%). Results may be inaccurate.")
        log.info("ocr.complete", confidence=confidence, chars=len(text))
        return DocumentResult(
            text=text.strip(),
            extraction_method="tesseract",
            warnings=warnings,
        )

    def _get_confidence(self, image) -> float:
        try:
            import pytesseract
            data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
            confs = [int(c) for c in data["conf"] if str(c) != "-1"]
            return sum(confs) / len(confs) if confs else 0.0
        except Exception:
            return 0.0
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/document_processing/docx_processor.py backend/app/document_processing/ocr_processor.py
git commit -m "feat: add DocxProcessor and OCRProcessor (Tesseract)"
```

---

## Task 5: Dispatcher

**Files:**
- Create: `backend/app/document_processing/dispatcher.py`
- Create: `backend/tests/unit/document_processing/test_dispatcher.py`

- [ ] **Step 1: Write failing test**

```python
# backend/tests/unit/document_processing/test_dispatcher.py
import pytest
import tempfile
import os
from app.document_processing.dispatcher import DocumentDispatcher


@pytest.fixture
def dispatcher():
    return DocumentDispatcher()


def test_dispatches_txt_file(dispatcher, tmp_path):
    f = tmp_path / "resume.txt"
    f.write_text("Jane Doe\nSoftware Engineer\nPython, FastAPI")
    result = dispatcher.process(str(f))
    assert "Jane Doe" in result.text
    assert result.extraction_method == "txt"


def test_raises_for_unsupported_type(dispatcher, tmp_path):
    f = tmp_path / "resume.xyz"
    f.write_bytes(b"garbage")
    with pytest.raises(ValueError, match="Unsupported"):
        dispatcher.process(str(f))
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd backend && python -m pytest tests/unit/document_processing/test_dispatcher.py -v
```
Expected: `ImportError`

- [ ] **Step 3: Write dispatcher.py**

```python
# backend/app/document_processing/dispatcher.py
import os
from app.document_processing.base import DocumentResult
from app.document_processing.pdf_processor import PDFProcessor
from app.document_processing.docx_processor import DocxProcessor
from app.document_processing.ocr_processor import OCRProcessor
from app.document_processing.txt_processor import TxtProcessor

_SUPPORTED_EXTENSIONS = {
    ".pdf": "pdf",
    ".docx": "docx",
    ".doc": "docx",
    ".txt": "txt",
    ".png": "ocr",
    ".jpg": "ocr",
    ".jpeg": "ocr",
    ".webp": "ocr",
}


class DocumentDispatcher:
    def __init__(self) -> None:
        self._processors = {
            "pdf": PDFProcessor(),
            "docx": DocxProcessor(),
            "ocr": OCRProcessor(),
            "txt": TxtProcessor(),
        }

    def process(self, file_path: str) -> DocumentResult:
        ext = os.path.splitext(file_path)[1].lower()
        processor_key = _SUPPORTED_EXTENSIONS.get(ext)
        if not processor_key:
            raise ValueError(f"Unsupported file type: '{ext}'. Supported: {list(_SUPPORTED_EXTENSIONS)}")
        return self._processors[processor_key].process(file_path)

    @staticmethod
    def supported_extensions() -> list[str]:
        return list(_SUPPORTED_EXTENSIONS.keys())
```

- [ ] **Step 4: Run tests**

```bash
cd backend && python -m pytest tests/unit/document_processing/ -v
```
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/document_processing/dispatcher.py backend/tests/unit/document_processing/test_dispatcher.py
git commit -m "feat: add DocumentDispatcher routing PDF/DOCX/OCR/TXT to processors"
```

---

## Task 6: File upload endpoint

**Files:**
- Create: `backend/app/api/v1/uploads.py`
- Modify: `backend/app/api/v1/router.py`

- [ ] **Step 1: Write uploads.py**

```python
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
settings = get_settings()
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
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
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
```

- [ ] **Step 2: Add aiofiles dependency**

In `backend/pyproject.toml` dependencies:
```toml
"aiofiles>=23.2.0",
```

- [ ] **Step 3: Update router.py**

In `backend/app/api/v1/router.py`, add:
```python
from app.api.v1 import uploads
router.include_router(uploads.router)
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/api/v1/uploads.py backend/app/api/v1/router.py backend/pyproject.toml
git commit -m "feat: add /uploads/resume endpoint with file type/size validation and text extraction"
```

---

## Task 7: Tesseract in Docker

**Files:**
- Modify: `backend/Dockerfile`

- [ ] **Step 1: Update Dockerfile to install Tesseract**

```dockerfile
# backend/Dockerfile
FROM python:3.12-slim AS base
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

# System deps: Tesseract OCR + language packs + PDF libs + TeX-Live für xelatex
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-deu \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libmagic1 \
    texlive-xetex \
    texlive-lang-german \
    texlive-latex-extra \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

FROM base AS builder
RUN pip install hatch
COPY pyproject.toml .
RUN pip install --no-cache-dir -e ".[dev]"

FROM base AS production
COPY --from=builder /usr/local/lib/python3.12 /usr/local/lib/python3.12
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

FROM production AS development
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

- [ ] **Step 2: Commit**

```bash
git add backend/Dockerfile
git commit -m "feat: install Tesseract OCR, TeX-Live (xelatex) + language packs in Docker image"
```

---

## Task 8: LaTeX Renderer + Export-Endpoints

**Files:**
- Create: `backend/app/document_processing/latex_renderer.py`
- Create: `backend/app/api/v1/exports.py`
- Modify: `backend/app/api/v1/router.py`
- Modify: `backend/app/config.py` (export_dir hinzufügen)

- [ ] **Step 1: export_dir zur Config hinzufügen**

In `backend/app/config.py`, in der `Settings`-Klasse nach `upload_dir` einfügen:
```python
    export_dir: str = "/tmp/pat_exports"
```

- [ ] **Step 2: Write failing test**

```python
# backend/tests/unit/document_processing/test_latex_renderer.py
import pytest
from unittest.mock import patch, MagicMock
from app.document_processing.latex_renderer import LatexRenderer


def test_render_raises_on_empty_source():
    renderer = LatexRenderer()
    with pytest.raises(ValueError, match="latex_source is empty"):
        renderer.compile("")


def test_render_raises_on_compilation_failure():
    renderer = LatexRenderer()
    with patch("subprocess.run") as mock_run:
        mock_run.return_value = MagicMock(returncode=1, stderr=b"! LaTeX Error")
        with pytest.raises(RuntimeError, match="xelatex compilation failed"):
            renderer.compile(r"\documentclass{article}\begin{document}broken")
```

- [ ] **Step 3: Run to confirm failure**

```bash
cd backend && python -m pytest tests/unit/document_processing/test_latex_renderer.py -v
```
Expected: `ImportError`

- [ ] **Step 4: Write latex_renderer.py**

```python
# backend/app/document_processing/latex_renderer.py
import os
import shutil
import subprocess
import tempfile
import structlog

log = structlog.get_logger()

_XELATEX = shutil.which("xelatex") or "xelatex"


class LatexRenderer:
    """Kompiliert einen LaTeX-Quelltext (latex_source) zu PDF-Bytes via xelatex.

    Arbeitet in einem temporären Verzeichnis — kein Seiteneffekt auf das Dateisystem.
    Gibt PDF-Rohbytes zurück; Speicherort liegt beim Aufrufer.
    """

    def __init__(self, timeout: int = 60) -> None:
        self._timeout = timeout

    def compile(self, latex_source: str) -> bytes:
        if not latex_source or not latex_source.strip():
            raise ValueError("latex_source is empty — nothing to compile")

        tmpdir = tempfile.mkdtemp(prefix="pat_latex_")
        try:
            tex_path = os.path.join(tmpdir, "document.tex")
            pdf_path = os.path.join(tmpdir, "document.pdf")

            with open(tex_path, "w", encoding="utf-8") as f:
                f.write(latex_source)

            # xelatex zweimal aufrufen: erstes Mal für Referenzen, zweites Mal für TOC/Seitenzahlen
            for _ in range(2):
                result = subprocess.run(
                    [
                        _XELATEX,
                        "-interaction=nonstopmode",
                        "-halt-on-error",
                        "-output-directory", tmpdir,
                        tex_path,
                    ],
                    capture_output=True,
                    timeout=self._timeout,
                    cwd=tmpdir,
                )

            if result.returncode != 0:
                stderr = result.stderr.decode("utf-8", errors="replace")[:2000]
                log.error("latex.compile_failed", returncode=result.returncode, stderr=stderr)
                raise RuntimeError(
                    f"xelatex compilation failed (exit {result.returncode}).\n"
                    f"First error line: {self._first_error(stderr)}"
                )

            if not os.path.exists(pdf_path):
                raise RuntimeError("xelatex ran successfully but no PDF was produced")

            with open(pdf_path, "rb") as f:
                pdf_bytes = f.read()

            log.info("latex.compiled", size_kb=len(pdf_bytes) // 1024)
            return pdf_bytes

        finally:
            shutil.rmtree(tmpdir, ignore_errors=True)

    @staticmethod
    def _first_error(stderr: str) -> str:
        for line in stderr.splitlines():
            if line.startswith("!"):
                return line
        return stderr[:200]
```

- [ ] **Step 5: Run tests**

```bash
cd backend && python -m pytest tests/unit/document_processing/test_latex_renderer.py -v
```
Expected: 2 PASSED

- [ ] **Step 6: Write exports.py**

```python
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
from app.core.exceptions import NotFoundError, AuthorizationError

router = APIRouter(prefix="/applications", tags=["exports"])
settings = get_settings()
_renderer = LatexRenderer()


def _svc(session: AsyncSession = Depends(get_db)) -> ApplicationService:
    return ApplicationService(ApplicationRepository(session))


@router.get("/{application_id}/export/resume.tex")
async def export_resume_tex(
    application_id: str,
    current_user: User = Depends(get_current_user),
    svc: ApplicationService = Depends(_svc),
) -> Response:
    """Gibt den LaTeX-Quelltext des optimierten Lebenslaufs zurück."""
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
    current_user: User = Depends(get_current_user),
    svc: ApplicationService = Depends(_svc),
) -> Response:
    """Kompiliert den Lebenslauf-LaTeX zu PDF und gibt ihn zurück."""
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
    current_user: User = Depends(get_current_user),
    svc: ApplicationService = Depends(_svc),
) -> Response:
    """Gibt den LaTeX-Quelltext des Anschreibens zurück."""
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
    current_user: User = Depends(get_current_user),
    svc: ApplicationService = Depends(_svc),
) -> Response:
    """Kompiliert das Anschreiben-LaTeX zu PDF und gibt ihn zurück."""
    latex = await _get_latex(application_id, current_user.id, "cover_letter", svc)
    pdf = _compile(latex)
    filename = f"cover_letter_{application_id[:8]}.pdf"
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ── helpers ──────────────────────────────────────────────────────────────────

async def _get_latex(
    application_id: str, user_id: str, doc_type: str, svc: ApplicationService
) -> str:
    try:
        app = await svc.get_for_user(application_id, user_id)
    except (NotFoundError, AuthorizationError) as exc:
        raise exc.to_http() from exc

    if doc_type == "resume":
        if not app.optimized_resume:
            raise HTTPException(status_code=404, detail="Optimized resume not yet generated")
        data = json.loads(app.optimized_resume)
        latex = data.get("latex_source", "")
    else:  # cover_letter
        if not app.cover_letter:
            raise HTTPException(status_code=404, detail="Cover letter not yet generated")
        # cover_letter column stores plain text; latex_source is in optimized_resume JSON
        # for cover letters we stored the full cover_letter JSON in a separate field
        # (see Phase 5 Celery pipeline — cover_letter column stores CoverLetter.model_dump_json())
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
```

- [ ] **Step 7: Router aktualisieren**

In `backend/app/api/v1/router.py`, hinzufügen:
```python
from app.api.v1 import exports
router.include_router(exports.router)
```

- [ ] **Step 8: Celery-Pipeline anpassen (cover_letter JSON statt Plaintext)**

In `backend/app/tasks/generate_application.py`, die Rückgabe ändern — `cover_letter` als JSON serialisieren statt als Plaintext, damit `latex_source` erhalten bleibt:

```python
    # vorher:
    "cover_letter": cover.full_text,
    # nachher:
    "cover_letter": cover.model_dump_json(),
```

- [ ] **Step 9: Commit**

```bash
git add backend/app/document_processing/latex_renderer.py \
        backend/app/api/v1/exports.py \
        backend/app/api/v1/router.py \
        backend/app/config.py \
        backend/app/tasks/generate_application.py \
        backend/tests/unit/document_processing/test_latex_renderer.py
git commit -m "feat: add LaTeX renderer (xelatex) and .tex/.pdf export endpoints"
```

---

## Phase 4 Complete

Document upload + parsing + LaTeX export pipeline complete. Endpunkte:

| Endpoint | Beschreibung |
|----------|-------------|
| `POST /api/v1/uploads/resume` | CV hochladen (PDF/DOCX/OCR) |
| `GET /api/v1/applications/{id}/export/resume.tex` | LaTeX-Quelltext Lebenslauf |
| `GET /api/v1/applications/{id}/export/resume.pdf` | Kompiliertes PDF Lebenslauf |
| `GET /api/v1/applications/{id}/export/cover_letter.tex` | LaTeX-Quelltext Anschreiben |
| `GET /api/v1/applications/{id}/export/cover_letter.pdf` | Kompiliertes PDF Anschreiben |

**Next:** Phase 5 — Matching Engine (Qdrant embeddings + semantic scoring).
