# backend/app/document_processing/moderncv_builder.py
"""Assembles moderncv LaTeX documents from structured AI output.

The AI provides content; all formatting lives here, making compilation
reliable and the output visually consistent across every application.
"""

from __future__ import annotations

from app.ai.schemas.document_schemas import CoverLetter, OptimizedResume
from app.ai.schemas.job_schemas import ParsedJob
from app.ai.schemas.resume_schemas import ParsedResume

# ---------------------------------------------------------------------------
# LaTeX escaping
# ---------------------------------------------------------------------------

_ESCAPE_TABLE = str.maketrans(
    {
        "&": r"\&",
        "%": r"\%",
        "$": r"\$",
        "#": r"\#",
        "_": r"\_",
        "{": r"\{",
        "}": r"\}",
        "~": r"\textasciitilde{}",
        "^": r"\textasciicircum{}",
        "\\": r"\textbackslash{}",
    }
)


def _esc(text: str | None) -> str:
    return (text or "").translate(_ESCAPE_TABLE)


def _split_name(full_name: str | None) -> tuple[str, str]:
    if not full_name:
        return "", ""
    parts = full_name.strip().rsplit(" ", 1)
    return (parts[0], parts[1]) if len(parts) == 2 else (parts[0], "")


# ---------------------------------------------------------------------------
# Shared preamble (xelatex-compatible — no inputenc/fontenc needed)
# ---------------------------------------------------------------------------

_PREAMBLE = r"""\documentclass[11pt,a4paper,sans]{moderncv}
\moderncvstyle{banking}
\moderncvcolor{blue}
\usepackage[scale=0.85]{geometry}
\usepackage[ngerman,english]{babel}
\nopagenumbers{}
"""


def _personal_block(parsed: ParsedResume) -> list[str]:
    first, last = _split_name(parsed.full_name)
    lines = [rf"\name{{{_esc(first)}}}{{{_esc(last)}}}"]
    if parsed.email:
        lines.append(rf"\email{{{_esc(parsed.email)}}}")
    if parsed.phone:
        lines.append(rf"\phone[mobile]{{{_esc(parsed.phone)}}}")
    if parsed.location:
        lines.append(rf"\address{{{_esc(parsed.location)}}}{{}}{{}}")
    return lines


# ---------------------------------------------------------------------------
# Resume builder
# ---------------------------------------------------------------------------


def build_resume(parsed: ParsedResume, optimized: OptimizedResume) -> str:
    lines: list[str] = [_PREAMBLE]
    lines += _personal_block(parsed)
    lines += ["", r"\begin{document}", r"\makecvtitle", ""]

    # --- Profile / Summary ---
    summary = optimized.summary or parsed.summary or ""
    if summary:
        lines += [r"\section{Berufliches Profil}", _esc(summary), ""]

    # --- Work Experience ---
    if parsed.work_experience:
        lines.append(r"\section{Berufserfahrung}")
        opt_sections = optimized.experience_sections
        for i, exp in enumerate(parsed.work_experience):
            end = "heute" if (exp.is_current or not exp.end_date) else _esc(exp.end_date)
            date_str = f"{_esc(exp.start_date)} -- {end}"

            # Prefer AI-optimized bullets, fall back to parsed achievements/responsibilities
            if i < len(opt_sections) and opt_sections[i].content:
                bullets = opt_sections[i].content
            elif exp.achievements:
                bullets = exp.achievements
            else:
                bullets = exp.responsibilities

            if bullets:
                items = "\n".join(rf"    \item {_esc(b)}" for b in bullets)
                desc = f"\n  \\begin{{itemize}}\n{items}\n  \\end{{itemize}}"
            else:
                desc = ""

            lines.append(
                rf"\cventry{{{date_str}}}{{{_esc(exp.title)}}}"
                rf"{{{_esc(exp.company)}}}{{}}{{}}{{{desc}}}"
            )
        lines.append("")

    # --- Education ---
    if parsed.education:
        lines.append(r"\section{Ausbildung}")
        for edu in parsed.education:
            year = str(edu.graduation_year) if edu.graduation_year else ""
            field = _esc(edu.field) if edu.field else ""
            lines.append(
                rf"\cventry{{{year}}}{{{_esc(edu.degree)}}}"
                rf"{{{_esc(edu.institution)}}}{{}}{{}}{{{field}}}"
            )
        lines.append("")

    # --- Certifications ---
    if parsed.certifications:
        lines.append(r"\section{Zertifizierungen}")
        for cert in parsed.certifications:
            year = str(cert.year) if cert.year else ""
            issuer = f", {_esc(cert.issuer)}" if cert.issuer else ""
            lines.append(rf"\cvitem{{{year}}}{{{_esc(cert.name)}{issuer}}}")
        lines.append("")

    # --- Kompetenzen (at the end, as requested) ---
    lines.append(r"\section{Kompetenzen}")

    # Fachliche Kompetenzen: AI-optimized skills take precedence over parsed
    fachlich = optimized.skills_section or parsed.skills
    if fachlich:
        lines.append(r"\cvitem{Fachlich}{" + ", ".join(_esc(s) for s in fachlich) + "}")

    if parsed.technologies:
        lines.append(
            r"\cvitem{Technologien}{" + ", ".join(_esc(t) for t in parsed.technologies) + "}"
        )

    if parsed.soft_skills:
        lines.append(
            r"\cvitem{Soft Skills}{" + ", ".join(_esc(s) for s in parsed.soft_skills) + "}"
        )

    if parsed.languages:
        lines.append(
            r"\cvitem{Sprachen}{" + ", ".join(_esc(lang) for lang in parsed.languages) + "}"
        )

    lines += ["", r"\end{document}"]
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Cover letter builder
# ---------------------------------------------------------------------------


def build_cover_letter(
    parsed: ParsedResume,
    letter: CoverLetter,
    job: ParsedJob,
) -> str:
    lines: list[str] = [_PREAMBLE]
    lines += _personal_block(parsed)
    lines += ["", r"\begin{document}", ""]

    company = _esc(job.company or "")
    lines += [
        rf"\recipient{{{company}}}{{}}",
        r"\date{\today}",
        rf"\opening{{{_esc(letter.salutation)},}}",
        rf"\closing{{{_esc(letter.sign_off)}}}",
        r"\enclosure[Anhang]{Lebenslauf}",
        "",
        r"\makelettertitle",
        "",
    ]

    lines.append(_esc(letter.opening_paragraph))
    lines.append("")
    for para in letter.body_paragraphs:
        lines.append(_esc(para))
        lines.append("")
    lines.append(_esc(letter.closing_paragraph))
    lines += ["", r"\makeletterclosing", "", r"\end{document}"]

    return "\n".join(lines)
