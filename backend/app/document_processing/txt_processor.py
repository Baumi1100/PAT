# backend/app/document_processing/txt_processor.py
from app.document_processing.base import DocumentResult


class TxtProcessor:
    def process(self, file_path: str) -> DocumentResult:
        with open(file_path, encoding="utf-8", errors="replace") as f:
            text = f.read()
        return DocumentResult(text=text.strip(), extraction_method="txt")
