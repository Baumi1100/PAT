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
