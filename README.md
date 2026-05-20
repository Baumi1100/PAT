# PAT — Personal Application Tracker

> AI-powered job application platform with multi-provider AI, ATS optimization, and Telegram Bot ingestion.

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.12-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)](https://fastapi.tiangolo.com)

## Features

- **AI-Provider Abstraction** — OpenAI, Anthropic Claude, Ollama (local), easily extensible
- **8 Specialized AI Agents** — Resume Parser, Job Analyzer, ATS Optimizer, Match Scorer, Cover Letter, Interview Questions, Skill Gap, Resume Generator
- **Telegram Bot** — Send job links, PDFs, screenshots; automated analysis starts immediately
- **ATS Optimization** — STAR-formatted bullet points, keyword injection, recruiter-ready formatting
- **Semantic Matching** — Qdrant vector DB for embedding-based skill similarity
- **Full History** — Every application, score, and generated document persisted
- **Local & Private** — Run entirely offline with Ollama models
- **LaTeX Output** — Resumes and cover letters generated as `.tex` + compiled to PDF via XeLaTeX

## Quick Start

```bash
cp .env.example .env
# edit .env — set SECRET_KEY, OPENAI_API_KEY or ANTHROPIC_API_KEY
docker compose up -d
# open http://localhost:3000
```

## Architecture

See [docs/architecture/overview.md](docs/architecture/overview.md)

## Development

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
cd backend && pip install -e ".[dev]"
pytest
```

## License

Apache License 2.0 — see [LICENSE](LICENSE)
