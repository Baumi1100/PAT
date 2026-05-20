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

---

## Setup

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- A terminal (macOS Terminal, iTerm2, etc.)

### 1. Clone and configure

```bash
git clone https://github.com/Baumi1100/PAT.git
cd PAT
cp backend/.env.example .env
```

Open `.env` in any text editor and fill in the values described below.

---

### 2. `.env` reference

#### Required — without these the backend won't start

| Variable | Example | Description |
|---|---|---|
| `SECRET_KEY` | `openssl rand -hex 32` | Random 32+ character string used to sign JWTs. Generate with the command shown. |
| `DATABASE_URL` | `postgresql+asyncpg://pat:pat@postgres:5432/pat` | Leave as-is when using Docker Compose — the hostname `postgres` is the container name. |

#### AI Provider — at least one key required for AI features

| Variable | Where to get it | Notes |
|---|---|---|
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | Sign in → "API keys" → "Create new secret key". Billing required (pay-per-use, ~$0.01–0.03 per application analysis). |
| `ANTHROPIC_API_KEY` | [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) | Sign in → "API Keys" → "Create Key". Same pay-per-use model. |
| `OLLAMA_BASE_URL` | `http://ollama:11434` | Only needed if you run Ollama locally for fully offline use. Leave the default value. |

You only need **one** of the three providers. OpenAI `gpt-4o-mini` is cheapest; Anthropic `claude-haiku` is comparable.

#### Telegram Bot — optional, skip if you don't need it

| Variable | How to get it | Notes |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Talk to [@BotFather](https://t.me/BotFather) on Telegram | Send `/newbot`, choose a name and username → BotFather gives you a token like `123456:ABC-DEF...`. |

How to create the bot:
1. Open Telegram and search for `@BotFather`
2. Send `/newbot`
3. Choose a display name (e.g. `My PAT Bot`)
4. Choose a username ending in `bot` (e.g. `my_pat_bot`)
5. Copy the token into `TELEGRAM_BOT_TOKEN`

#### Optional — defaults work fine for local use

| Variable | Default | Description |
|---|---|---|
| `REDIS_URL` | `redis://redis:6379/0` | Leave as-is with Docker Compose. |
| `QDRANT_HOST` | `qdrant` | Leave as-is with Docker Compose. |
| `MAX_UPLOAD_SIZE_MB` | `10` | Maximum file size for resume uploads. |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | Add your frontend URL if you deploy publicly. |
| `DEBUG` | `false` | Set to `true` for verbose backend logs during development. |

#### Complete `.env` example

```dotenv
# --- Required ---
SECRET_KEY=your-random-32-char-string-here-change-me
DATABASE_URL=postgresql+asyncpg://pat:pat@postgres:5432/pat

# --- AI: pick at least one ---
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
# OLLAMA_BASE_URL=http://ollama:11434

# --- Telegram (optional) ---
TELEGRAM_BOT_TOKEN=123456:ABC-DEFxxxxxxxx

# --- Leave these as-is for Docker ---
REDIS_URL=redis://redis:6379/0
QDRANT_HOST=qdrant
QDRANT_PORT=6333
CORS_ORIGINS=["http://localhost:3000"]
```

---

### 3. Generate a SECRET_KEY

```bash
openssl rand -hex 32
```

Copy the output into `SECRET_KEY` in your `.env`.

---

### 4. Start the stack

```bash
docker compose up --build
```

This builds and starts:
- **postgres** — application database
- **redis** — task queue broker
- **qdrant** — vector database for semantic matching
- **backend** — FastAPI REST API on port 8000
- **celery_worker** — background AI pipeline worker
- **frontend** — Next.js UI on port 3000
- **telegram_bot** — Telegram bot (only active if `TELEGRAM_BOT_TOKEN` is set)

First build takes 5–10 minutes (downloads base images, installs Python deps, TeX Live for PDF export).

After that:

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API docs (Swagger) | http://localhost:8000/docs |
| API health | http://localhost:8000/health |
| AI provider status | http://localhost:8000/health/ai |

---

### 5. Create your account

PAT has no pre-created accounts. You register yourself on first use.

**Option A — Web UI:**
1. Open http://localhost:3000
2. Click **Sign up** / fill in name, email, and password on the login page
3. You are logged in immediately

**Option B — API (curl):**
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "password": "YourPassword1!", "full_name": "Your Name"}'
```

Then log in at http://localhost:3000 with those credentials.

---

### 6. Upload your resume and start using PAT

1. Go to **Resumes** → upload your CV as PDF or DOCX
2. Go to **Jobs** — jobs arrive via the Telegram bot or the API
3. PAT automatically runs all 8 AI agents when a job is submitted and shows match score, skill gaps, cover letter, and interview prep in the application detail view

---

### 7. Link your Telegram account

After creating an account and starting the bot, you need to link your Telegram identity to your PAT account once — this is how the bot knows which user to submit jobs for.

**Step 1 — Get your Telegram Chat ID:**

Open Telegram and send `/myid` (or `/start`) to your bot.
The bot replies with your Chat ID, for example:

```
Your Telegram Chat ID is: 123456789
```

**Step 2 — Save it in PAT:**

1. Open http://localhost:3000 and log in
2. Go to **Settings**
3. Paste the Chat ID into the **Telegram** field and click **Save**

That's it. The bot will now submit jobs directly into your account whenever you send it a job URL, description, PDF, or screenshot.

---

### Stopping and restarting

```bash
# Stop (keeps data)
docker compose down

# Start again (no rebuild needed)
docker compose up

# Rebuild after a code change
docker compose up --build

# Stop and delete all data (fresh start)
docker compose down -v
```

---

## Development

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
cd backend && pip install -e ".[dev]"
pytest
```

## Architecture

See [docs/architecture/overview.md](docs/architecture/overview.md)

## License

Apache License 2.0 — see [LICENSE](LICENSE)
