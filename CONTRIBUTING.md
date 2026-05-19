# Contributing to PAT

## Development Setup

1. Fork and clone the repo
2. `cp .env.example .env` and configure
3. `docker compose up -d postgres redis qdrant`
4. `cd backend && pip install -e ".[dev]"`
5. `pytest` — all tests must pass

## Code Standards

- **Python:** Ruff + Black + mypy strict
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`)
- **Tests:** TDD — write the failing test first
- **PRs:** One feature per PR, tests required

## Running Linters

```bash
cd backend
ruff check .
black --check .
mypy app/
```
