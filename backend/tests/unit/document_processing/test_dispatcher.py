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
