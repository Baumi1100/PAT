# Contributing to PAT

## Development Setup

### Backend

1. Fork and clone the repo
2. `cp backend/.env.example .env` and configure
3. `docker compose up -d postgres redis qdrant`
4. `cd backend && pip install -e ".[dev]"`
5. `pytest` — all tests must pass

The backend runs at http://localhost:8000. Swagger UI: http://localhost:8000/docs.

### Frontend

The frontend is a Next.js 15 app (TypeScript, Tailwind CSS, App Router).

```bash
cd frontend
npm install
npm run dev     # starts dev server on http://localhost:3000 with hot reload
```

For a production build (matches what Docker runs):
```bash
npm run build
npm run start
```

TypeScript check (no compilation errors):
```bash
npm run build   # type errors fail the build
# or:
npx tsc --noEmit
```

**Font note:** Fonts are bundled via `@fontsource/dm-sans` (npm package). No internet access needed during build — this is intentional for Docker compatibility.

**Design tokens:** Tailwind color tokens are in `tailwind.config.ts`. CSS variables are in `src/app/globals.css`. Custom token names intentionally avoid Tailwind built-in suffixes (`border-strong`, `card-hover`, `primary-soft` rather than `border-2`, `card-2`, `primary-2`).

## Code Standards

- **Python:** Ruff + Black + mypy strict
- **TypeScript:** No `any`, no `// @ts-ignore` without comment explaining why
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`)
- **Tests:** TDD — write the failing test first (backend); component tests for new UI components
- **PRs:** One feature per PR, tests required

## Running Linters

### Backend
```bash
cd backend
ruff check .
black --check .
mypy app/
```

### Frontend
```bash
cd frontend
npm run build   # catches TypeScript errors
```
