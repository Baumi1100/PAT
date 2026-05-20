# backend/app/document_processing/dispatcher.py
import os
from typing import Protocol

from app.document_processing.base import DocumentResult
from app.document_processing.docx_processor import DocxProcessor
from app.document_processing.ocr_processor import OCRProcessor
from app.document_processing.pdf_processor import PDFProcessor
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


class _Processor(Protocol):
    def process(self, file_path: str) -> DocumentResult: ...


class DocumentDispatcher:
    def __init__(self) -> None:
        self._processors: dict[str, _Processor] = {
            "pdf": PDFProcessor(),
            "docx": DocxProcessor(),
            "ocr": OCRProcessor(),
            "txt": TxtProcessor(),
        }

    def process(self, file_path: str) -> DocumentResult:
        ext = os.path.splitext(file_path)[1].lower()
        processor_key = _SUPPORTED_EXTENSIONS.get(ext)
        if not processor_key:
            supported = list(_SUPPORTED_EXTENSIONS)
            raise ValueError(f"Unsupported file type: '{ext}'. Supported: {supported}")
        return self._processors[processor_key].process(file_path)

    @staticmethod
    def supported_extensions() -> list[str]:
        return list(_SUPPORTED_EXTENSIONS.keys())
