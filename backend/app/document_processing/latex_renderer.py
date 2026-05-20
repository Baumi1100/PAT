# backend/app/document_processing/latex_renderer.py
import os
import shutil
import subprocess
import tempfile

import structlog

log = structlog.get_logger()

_XELATEX = shutil.which("xelatex") or "xelatex"


class LatexRenderer:
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

            # xelatex twice: first run for content, second for references/TOC
            for _ in range(2):
                try:
                    result = subprocess.run(
                        [
                            _XELATEX,
                            "-interaction=nonstopmode",
                            "-halt-on-error",
                            "-output-directory",
                            tmpdir,
                            tex_path,
                        ],
                        capture_output=True,
                        timeout=self._timeout,
                        cwd=tmpdir,
                    )
                except subprocess.TimeoutExpired as exc:
                    raise RuntimeError(f"xelatex timed out after {self._timeout}s") from exc

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
