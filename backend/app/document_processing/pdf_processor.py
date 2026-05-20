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

        with fitz.open(file_path) as doc:
            pages = doc.page_count
            text = "\n".join(page.get_text() for page in doc)
        return text, "pymupdf", pages

    @staticmethod
    def _try_pdfplumber(file_path: str) -> tuple[str, str, int]:
        import pdfplumber

        with pdfplumber.open(file_path) as pdf:
            pages = len(pdf.pages)
            text = "\n".join(p.extract_text() or "" for p in pdf.pages)
        return text, "pdfplumber", pages
