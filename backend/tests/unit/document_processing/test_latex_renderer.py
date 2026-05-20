# backend/tests/unit/document_processing/test_latex_renderer.py
from unittest.mock import MagicMock, patch

import pytest

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
