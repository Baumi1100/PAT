# backend/app/ai/schemas/latex_templates.py
RESUME_PREAMBLE = r"""
\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[ngerman,english]{babel}
\usepackage{geometry}
\geometry{top=2cm, bottom=2cm, left=2.5cm, right=2.5cm}
\usepackage{enumitem}
\usepackage{titlesec}
\usepackage{parskip}
\usepackage{hyperref}
\hypersetup{colorlinks=true, urlcolor=blue}
\titleformat{\section}{\large\bfseries}{}{0em}{}[\titlerule]
\setlist[itemize]{leftmargin=1.5em, itemsep=0pt, topsep=2pt}
\pagestyle{empty}
"""

RESUME_TEMPLATE = r"""
%(preamble)s
\begin{document}

%%--- HEADER
\begin{center}
  {\LARGE \textbf{%(full_name)s}} \\[4pt]
  %(email)s \quad|\quad %(phone)s \quad|\quad %(location)s
\end{center}

\section*{Professional Summary}
%(summary)s

\section*{Technical Skills}
%(skills_list)s

\section*{Professional Experience}
%(experience_blocks)s

\section*{Education}
%(education_blocks)s

\end{document}
"""

COVER_LETTER_TEMPLATE = r"""
%(preamble)s
\begin{document}

\begin{flushright}
  %(applicant_name)s \\
  %(date)s
\end{flushright}

\bigskip
%(salutation)s,

\bigskip
%(opening_paragraph)s

%(body_paragraphs)s

%(closing_paragraph)s

\bigskip
%(sign_off)s \\[8pt]
%(applicant_name)s

\end{document}
"""
