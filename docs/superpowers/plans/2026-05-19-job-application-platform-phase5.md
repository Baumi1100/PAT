# Job Application Platform — Phase 5: Matching Engine, Telegram Bot, Frontend

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement semantic matching via Qdrant embeddings, the Telegram bot for job ingestion, and the Next.js frontend dashboard.

**Architecture:**
- **Matching Engine:** Qdrant stores resume and job embeddings. `MatchEngine` computes cosine similarity + keyword overlap + experience weighting. Called from the Celery pipeline.
- **Telegram Bot:** python-telegram-bot v21. Handlers for text, URLs, documents, photos. Extracts job content and creates Job + Application records via the backend API.
- **Frontend:** Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui. API client uses axios. Auth via JWT stored in httpOnly cookies (next-auth or custom). Dark mode via next-themes.

**Prerequisite:** Phases 1–4 complete.

---

## File Map

```
backend/app/matching/
├── __init__.py
├── embedding_service.py     # Qdrant + OpenAI embeddings
├── keyword_matcher.py       # TF-IDF style keyword overlap score
└── match_engine.py          # Orchestrates all scoring signals

backend/app/integrations/telegram/
├── __init__.py
├── bot.py                   # Application setup
├── handlers.py              # /start, text, document, photo
└── url_extractor.py         # httpx fetch job URL content

frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx               # redirect to /dashboard
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   └── (app)/
│   │       ├── layout.tsx         # sidebar + auth guard
│   │       ├── dashboard/page.tsx
│   │       ├── jobs/
│   │       │   ├── page.tsx       # job list
│   │       │   └── [id]/page.tsx  # job detail + match score
│   │       ├── resumes/page.tsx
│   │       ├── applications/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx  # application detail
│   │       └── settings/page.tsx  # AI provider config
│   ├── components/
│   │   ├── ui/                    # shadcn components (auto-generated)
│   │   ├── dashboard/
│   │   │   ├── StatsCards.tsx
│   │   │   └── RecentApplications.tsx
│   │   ├── jobs/
│   │   │   ├── JobCard.tsx
│   │   │   └── MatchScoreBadge.tsx
│   │   ├── applications/
│   │   │   ├── ApplicationDetail.tsx
│   │   │   ├── SkillGapChart.tsx
│   │   │   └── CoverLetterViewer.tsx
│   │   └── layout/
│   │       ├── Sidebar.tsx
│   │       └── ThemeToggle.tsx
│   ├── lib/
│   │   ├── api.ts             # axios client with JWT interceptor
│   │   └── auth.ts            # token storage + auth helpers
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useApplications.ts
│   └── types/
│       └── api.ts             # TypeScript interfaces matching backend schemas
├── Dockerfile
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Task 1: Embedding service + Qdrant

**Files:**
- Create: `backend/app/matching/embedding_service.py`

- [ ] **Step 1: Write embedding_service.py**

```python
# backend/app/matching/embedding_service.py
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams
from openai import AsyncOpenAI
from app.config import get_settings

settings = get_settings()

COLLECTION_RESUMES = "resumes"
COLLECTION_JOBS = "jobs"
EMBEDDING_MODEL = "text-embedding-3-small"
VECTOR_SIZE = 1536


async def get_qdrant() -> AsyncQdrantClient:
    return AsyncQdrantClient(host=settings.qdrant_host, port=settings.qdrant_port)


async def ensure_collections(client: AsyncQdrantClient) -> None:
    for name in [COLLECTION_RESUMES, COLLECTION_JOBS]:
        existing = await client.get_collections()
        names = [c.name for c in existing.collections]
        if name not in names:
            await client.create_collection(
                collection_name=name,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
            )


async def embed_text(text: str) -> list[float]:
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    response = await client.embeddings.create(input=text[:8000], model=EMBEDDING_MODEL)
    return response.data[0].embedding


async def upsert_resume_embedding(resume_id: str, text: str) -> None:
    vector = await embed_text(text)
    client = await get_qdrant()
    await ensure_collections(client)
    await client.upsert(
        collection_name=COLLECTION_RESUMES,
        points=[PointStruct(id=resume_id, vector=vector, payload={"resume_id": resume_id})],
    )


async def upsert_job_embedding(job_id: str, text: str) -> None:
    vector = await embed_text(text)
    client = await get_qdrant()
    await ensure_collections(client)
    await client.upsert(
        collection_name=COLLECTION_JOBS,
        points=[PointStruct(id=job_id, vector=vector, payload={"job_id": job_id})],
    )


async def compute_semantic_similarity(resume_id: str, job_id: str) -> float:
    """Returns cosine similarity 0.0–1.0 between resume and job embeddings."""
    client = await get_qdrant()
    resume_vec = (await client.retrieve(COLLECTION_RESUMES, ids=[resume_id]))[0].vector
    job_vec = (await client.retrieve(COLLECTION_JOBS, ids=[job_id]))[0].vector
    if not resume_vec or not job_vec:
        return 0.0
    dot = sum(a * b for a, b in zip(resume_vec, job_vec))
    mag_r = sum(x * x for x in resume_vec) ** 0.5
    mag_j = sum(x * x for x in job_vec) ** 0.5
    return dot / (mag_r * mag_j) if mag_r and mag_j else 0.0
```

- [ ] **Step 2: Add qdrant-client async support**

In `backend/pyproject.toml`, verify `qdrant-client>=1.9.0` is in dependencies (already added in Phase 1).

- [ ] **Step 3: Commit**

```bash
git add backend/app/matching/embedding_service.py
git commit -m "feat: add Qdrant embedding service for resume/job semantic similarity"
```

---

## Task 2: Keyword matcher

**Files:**
- Create: `backend/app/matching/keyword_matcher.py`

- [ ] **Step 1: Write keyword_matcher.py**

```python
# backend/app/matching/keyword_matcher.py
import re
from app.ai.schemas.resume_schemas import ParsedResume
from app.ai.schemas.job_schemas import ParsedJob


def _normalize(term: str) -> str:
    return re.sub(r"[^a-z0-9+#.]", "", term.lower())


def compute_keyword_overlap(resume: ParsedResume, job: ParsedJob) -> float:
    """Returns 0.0–100.0: % of job's must-have keywords found in resume."""
    resume_terms = {
        _normalize(t) for t in resume.skills + resume.technologies if t
    }
    must_have = [_normalize(k) for k in job.must_have_skills + job.ats_keywords if k]
    if not must_have:
        return 100.0
    matched = sum(1 for k in must_have if k in resume_terms)
    return round((matched / len(must_have)) * 100, 1)


def compute_experience_score(resume: ParsedResume, job: ParsedJob) -> float:
    """Returns 0.0–100.0 based on years of experience vs job requirement."""
    required = job.min_years_experience or 0
    actual = resume.years_of_experience or 0
    if required == 0:
        return 100.0
    ratio = min(actual / required, 1.5)  # cap bonus at 1.5x
    return round(min(ratio * 100, 100), 1)
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/matching/keyword_matcher.py
git commit -m "feat: add keyword overlap and experience scoring for matching"
```

---

## Task 3: Match engine orchestrator

**Files:**
- Create: `backend/app/matching/match_engine.py`

- [ ] **Step 1: Write match_engine.py**

```python
# backend/app/matching/match_engine.py
from app.ai.schemas.resume_schemas import ParsedResume
from app.ai.schemas.job_schemas import ParsedJob
from app.matching.keyword_matcher import compute_keyword_overlap, compute_experience_score


async def compute_combined_match_score(
    resume: ParsedResume,
    job: ParsedJob,
    resume_id: str | None = None,
    job_id: str | None = None,
    ai_score: float | None = None,
) -> float:
    """
    Weighted score:
      - AI agent match score:    40%
      - Keyword overlap score:   35%
      - Experience score:        25%
    If resume_id + job_id provided, also computes semantic similarity
    and blends it into the AI component.
    """
    keyword_score = compute_keyword_overlap(resume, job)
    experience_score = compute_experience_score(resume, job)

    semantic_score: float = 0.0
    if resume_id and job_id:
        try:
            from app.matching.embedding_service import compute_semantic_similarity
            similarity = await compute_semantic_similarity(resume_id, job_id)
            semantic_score = similarity * 100
        except Exception:
            pass  # Qdrant unavailable — degrade gracefully

    # Blend AI agent score with semantic score for the AI component
    if ai_score is not None and semantic_score > 0:
        blended_ai = (ai_score * 0.7) + (semantic_score * 0.3)
    elif ai_score is not None:
        blended_ai = ai_score
    else:
        blended_ai = semantic_score

    overall = (blended_ai * 0.40) + (keyword_score * 0.35) + (experience_score * 0.25)
    return round(min(overall, 100.0), 1)
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/matching/match_engine.py
git commit -m "feat: add MatchEngine combining AI, keyword, and experience scores"
```

---

## Task 4: Telegram bot

**Files:**
- Create: `backend/app/integrations/telegram/bot.py`
- Create: `backend/app/integrations/telegram/handlers.py`
- Create: `backend/app/integrations/telegram/url_extractor.py`

- [ ] **Step 1: Add python-telegram-bot to dependencies**

In `backend/pyproject.toml` dependencies:
```toml
"python-telegram-bot[webhooks]>=21.0.0",
"beautifulsoup4>=4.12.0",
"lxml>=5.2.0",
```

- [ ] **Step 2: Write url_extractor.py**

```python
# backend/app/integrations/telegram/url_extractor.py
import re
import httpx
from bs4 import BeautifulSoup


_URL_RE = re.compile(r"https?://[^\s]+")


def extract_urls(text: str) -> list[str]:
    return _URL_RE.findall(text)


async def fetch_job_text_from_url(url: str, timeout: int = 15) -> str:
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
    }
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        resp = await client.get(url, headers=headers)
        resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "lxml")
    # Remove scripts and styles
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()

    # Try common job posting containers first
    for selector in [
        "[data-testid='job-description']",
        ".job-description",
        "#job-description",
        "article",
        "main",
    ]:
        element = soup.select_one(selector)
        if element and len(element.get_text(strip=True)) > 200:
            return element.get_text(separator="\n", strip=True)[:10000]

    return soup.get_text(separator="\n", strip=True)[:10000]
```

- [ ] **Step 3: Write handlers.py**

```python
# backend/app/integrations/telegram/handlers.py
import os
import tempfile
import httpx
from telegram import Update
from telegram.ext import ContextTypes
from app.integrations.telegram.url_extractor import extract_urls, fetch_job_text_from_url
from app.document_processing.dispatcher import DocumentDispatcher

_dispatcher = DocumentDispatcher()


async def handle_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        "👋 Welcome to PAT — Personal Application Tracker!\n\n"
        "Send me:\n"
        "• A job posting URL\n"
        "• A copied job description (text)\n"
        "• A PDF or DOCX of the job posting\n"
        "• A screenshot of the job posting\n\n"
        "I'll analyze it and compare it with your resume."
    )


async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    text = update.message.text or ""
    chat_id = str(update.effective_chat.id)

    urls = extract_urls(text)
    if urls:
        await update.message.reply_text(f"🔍 Fetching job from {urls[0]}...")
        try:
            job_text = await fetch_job_text_from_url(urls[0])
            await _submit_job(chat_id, job_text, source="telegram_url", url=urls[0], context=context)
        except Exception as exc:
            await update.message.reply_text(f"❌ Could not fetch URL: {exc}")
        return

    # Treat plain text as pasted job description
    if len(text) > 100:
        await update.message.reply_text("📋 Processing job description...")
        await _submit_job(chat_id, text, source="telegram_text", context=context)
    else:
        await update.message.reply_text(
            "Please send a job URL, paste the full job description, or upload a file."
        )


async def handle_document(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    doc = update.message.document
    chat_id = str(update.effective_chat.id)

    if doc.file_size > 10 * 1024 * 1024:
        await update.message.reply_text("❌ File too large. Max 10MB.")
        return

    await update.message.reply_text("📄 Processing document...")
    file = await context.bot.get_file(doc.file_id)
    ext = os.path.splitext(doc.file_name or "file.pdf")[1].lower() or ".pdf"

    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        await file.download_to_drive(tmp.name)
        try:
            result = _dispatcher.process(tmp.name)
            await _submit_job(chat_id, result.text, source="telegram_document", context=context)
        finally:
            os.unlink(tmp.name)


async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = str(update.effective_chat.id)
    photo = update.message.photo[-1]  # highest resolution
    await update.message.reply_text("🖼️ Running OCR on image...")
    file = await context.bot.get_file(photo.file_id)

    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        await file.download_to_drive(tmp.name)
        try:
            result = _dispatcher.process(tmp.name)
            if len(result.text) < 50:
                await update.message.reply_text(
                    "❌ Could not extract text from image. Try sending the job as text or PDF."
                )
                return
            await _submit_job(chat_id, result.text, source="telegram_photo", context=context)
        finally:
            os.unlink(tmp.name)


async def _submit_job(
    chat_id: str, job_text: str, source: str, url: str | None = None,
    context: ContextTypes.DEFAULT_TYPE = None,
) -> None:
    """Posts job to backend API and triggers analysis pipeline."""
    from app.config import get_settings
    settings = get_settings()
    backend_url = getattr(settings, "backend_internal_url", "http://backend:8000")

    async with httpx.AsyncClient(timeout=30) as client:
        # Resolve telegram_chat_id → user + token
        resp = await client.post(
            f"{backend_url}/api/v1/auth/telegram-login",
            json={"telegram_chat_id": chat_id},
        )
        if resp.status_code != 200:
            await context.bot.send_message(
                chat_id,
                "❌ Your Telegram account is not linked to a PAT account. "
                "Log in to the web app and link your Telegram in Settings.",
            )
            return

        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        job_resp = await client.post(
            f"{backend_url}/api/v1/jobs/",
            json={"title": "Job from Telegram", "raw_text": job_text, "source": source, "url": url},
            headers=headers,
        )
        if job_resp.status_code != 201:
            await context.bot.send_message(chat_id, "❌ Failed to save job. Try again.")
            return

        job_id = job_resp.json()["id"]
        await context.bot.send_message(
            chat_id,
            f"✅ Job saved! Analysis starting...\n"
            f"Check the dashboard for results: job ID `{job_id}`",
            parse_mode="Markdown",
        )
```

- [ ] **Step 4: Write bot.py**

```python
# backend/app/integrations/telegram/bot.py
from telegram.ext import Application, CommandHandler, MessageHandler, filters
from app.config import get_settings
from app.integrations.telegram.handlers import (
    handle_start,
    handle_text,
    handle_document,
    handle_photo,
)


def create_bot_application() -> Application:
    settings = get_settings()
    if not settings.telegram_bot_token:
        raise ValueError("TELEGRAM_BOT_TOKEN not configured")

    app = Application.builder().token(settings.telegram_bot_token).build()
    app.add_handler(CommandHandler("start", handle_start))
    app.add_handler(MessageHandler(filters.PHOTO, handle_photo))
    app.add_handler(MessageHandler(filters.Document.ALL, handle_document))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    return app


if __name__ == "__main__":
    bot_app = create_bot_application()
    bot_app.run_polling(drop_pending_updates=True)
```

- [ ] **Step 5: Add Telegram service to docker-compose.yml**

Add to `docker-compose.yml` services:
```yaml
  telegram_bot:
    build:
      context: ./backend
      target: production
    command: python -m app.integrations.telegram.bot
    env_file: .env
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped
```

- [ ] **Step 6: Commit**

```bash
git add backend/app/integrations/telegram/ backend/pyproject.toml docker-compose.yml
git commit -m "feat: add Telegram bot with URL fetch, document, OCR and job ingestion"
```

---

## Task 5: Frontend — Next.js scaffold

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/next.config.ts`
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/Dockerfile`

- [ ] **Step 1: Write package.json**

```json
{
  "name": "pat-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start --port 3000",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "15.3.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "axios": "^1.7.0",
    "next-themes": "^0.4.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.445.0",
    "tailwind-merge": "^2.5.0"
  },
  "devDependencies": {
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5.6.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^9",
    "eslint-config-next": "15.3.0"
  }
}
```

- [ ] **Step 2: Write next.config.ts**

```typescript
// frontend/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  },
};

export default nextConfig;
```

- [ ] **Step 3: Write tailwind.config.ts**

```typescript
// frontend/tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 4: Write tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Write Dockerfile**

```dockerfile
# frontend/Dockerfile
FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS production
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

- [ ] **Step 6: Commit**

```bash
git add frontend/package.json frontend/next.config.ts frontend/tailwind.config.ts frontend/tsconfig.json frontend/Dockerfile
git commit -m "feat: scaffold Next.js 15 frontend with Tailwind and TypeScript"
```

---

## Task 6: Frontend API client and types

**Files:**
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/types/api.ts`
- Create: `frontend/src/lib/auth.ts`

- [ ] **Step 1: Write types/api.ts**

```typescript
// frontend/src/types/api.ts
export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Job {
  id: string;
  user_id: string;
  title: string;
  company: string | null;
  location: string | null;
  url: string | null;
  source: string;
  status: string;
  match_score: number | null;
  created_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  title: string;
  file_name: string | null;
  file_type: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  job_id: string;
  resume_id: string;
  match_score: number | null;
  status: string;
  celery_task_id: string | null;
  created_at: string;
  strengths?: string[] | null;
  weaknesses?: string[] | null;
  skill_gaps?: string[] | null;
  suggestions?: string[] | null;
  cover_letter?: string | null;
  interview_questions?: string[] | null;
}

export interface AIProviderConfig {
  id: string;
  task_type: string;
  provider: string;
  model: string;
  is_active: boolean;
}
```

- [ ] **Step 2: Write lib/auth.ts**

```typescript
// frontend/src/lib/auth.ts
const ACCESS_KEY = "pat_access_token";
const REFRESH_KEY = "pat_refresh_token";

export const tokenStorage = {
  getAccess: (): string | null =>
    typeof window !== "undefined" ? localStorage.getItem(ACCESS_KEY) : null,
  getRefresh: (): string | null =>
    typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null,
  set: (access: string, refresh: string): void => {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: (): void => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};
```

- [ ] **Step 3: Write lib/api.ts**

```typescript
// frontend/src/lib/api.ts
import axios, { AxiosInstance, AxiosError } from "axios";
import { tokenStorage } from "@/lib/auth";
import type {
  Application,
  AIProviderConfig,
  Job,
  Resume,
  TokenResponse,
  User,
} from "@/types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function createClient(): AxiosInstance {
  const client = axios.create({ baseURL: `${BASE_URL}/api/v1` });

  client.interceptors.request.use((config) => {
    const token = tokenStorage.getAccess();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    (r) => r,
    async (error: AxiosError) => {
      if (error.response?.status === 401) {
        tokenStorage.clear();
        if (typeof window !== "undefined") window.location.href = "/login";
      }
      return Promise.reject(error);
    }
  );

  return client;
}

const client = createClient();

export const authApi = {
  login: (email: string, password: string) =>
    client.post<TokenResponse>("/auth/login", { email, password }),
  register: (email: string, password: string, full_name: string) =>
    client.post<User>("/auth/register", { email, password, full_name }),
  me: () => client.get<User>("/users/me"),
};

export const jobsApi = {
  list: (status?: string) =>
    client.get<Job[]>("/jobs/", { params: status ? { status } : undefined }),
  get: (id: string) => client.get<Job>(`/jobs/${id}`),
  create: (data: Partial<Job>) => client.post<Job>("/jobs/", data),
  delete: (id: string) => client.delete(`/jobs/${id}`),
};

export const resumesApi = {
  list: () => client.get<Resume[]>("/resumes/"),
  get: (id: string) => client.get<Resume>(`/resumes/${id}`),
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return client.post<Resume>("/uploads/resume", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  delete: (id: string) => client.delete(`/resumes/${id}`),
};

export const applicationsApi = {
  list: () => client.get<Application[]>("/applications/"),
  get: (id: string) => client.get<Application>(`/applications/${id}`),
  create: (job_id: string, resume_id: string) =>
    client.post<Application>("/applications/", { job_id, resume_id }),
};

// Export-Endpunkte — liefern Blob-Responses für .tex und .pdf Downloads
export const exportApi = {
  resumeTex: (id: string) =>
    client.get(`/applications/${id}/export/resume.tex`, { responseType: "blob" }),
  resumePdf: (id: string) =>
    client.get(`/applications/${id}/export/resume.pdf`, { responseType: "blob" }),
  coverLetterTex: (id: string) =>
    client.get(`/applications/${id}/export/cover_letter.tex`, { responseType: "blob" }),
  coverLetterPdf: (id: string) =>
    client.get(`/applications/${id}/export/cover_letter.pdf`, { responseType: "blob" }),
};

/** Browser-Download eines Blob aus einer API-Response triggern. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/ frontend/src/types/
git commit -m "feat: add TypeScript API client with axios and JWT interceptor"
```

---

## Task 7: Frontend — core pages

**Files:**
- Create: `frontend/src/app/layout.tsx`
- Create: `frontend/src/app/(auth)/login/page.tsx`
- Create: `frontend/src/app/(app)/layout.tsx`
- Create: `frontend/src/app/(app)/dashboard/page.tsx`
- Create: `frontend/src/app/(app)/jobs/page.tsx`
- Create: `frontend/src/app/(app)/applications/[id]/page.tsx`
- Create: `frontend/src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Write app/layout.tsx**

```tsx
// frontend/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PAT — Personal Application Tracker",
  description: "AI-powered job application platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Write globals.css**

```css
/* frontend/src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}
```

- [ ] **Step 3: Write login page**

```tsx
// frontend/src/app/(auth)/login/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { tokenStorage } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const resp = await authApi.login(email, password);
      tokenStorage.set(resp.data.access_token, resp.data.refresh_token);
      router.push("/dashboard");
    } catch {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 rounded-xl border border-border bg-card shadow-lg">
        <h1 className="text-2xl font-bold mb-2 text-foreground">PAT</h1>
        <p className="text-muted-foreground mb-6">Sign in to your account</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email" required
            className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground"
          />
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Password" required
            className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write dashboard page**

```tsx
// frontend/src/app/(app)/dashboard/page.tsx
"use client";
import { useEffect, useState } from "react";
import { applicationsApi, jobsApi } from "@/lib/api";
import type { Application, Job } from "@/types/api";

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    jobsApi.list().then((r) => setJobs(r.data)).catch(() => {});
    applicationsApi.list().then((r) => setApplications(r.data)).catch(() => {});
  }, []);

  const avgScore =
    applications.filter((a) => a.match_score !== null).length > 0
      ? Math.round(
          applications.reduce((s, a) => s + (a.match_score ?? 0), 0) /
            applications.filter((a) => a.match_score !== null).length
        )
      : null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Jobs" value={jobs.length} />
        <StatCard label="Applications" value={applications.length} />
        <StatCard label="Avg Match Score" value={avgScore !== null ? `${avgScore}%` : "—"} />
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-3">Recent Applications</h2>
        <div className="space-y-2">
          {applications.slice(0, 5).map((app) => (
            <a
              key={app.id}
              href={`/applications/${app.id}`}
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
            >
              <span className="text-sm text-muted-foreground">{app.job_id}</span>
              <div className="flex items-center gap-3">
                <StatusBadge status={app.status} />
                {app.match_score !== null && (
                  <span className="font-bold text-primary">{app.match_score}%</span>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-6 rounded-xl border border-border bg-card">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400",
    analyzing: "bg-blue-500/20 text-blue-400",
    complete: "bg-green-500/20 text-green-400",
    error: "bg-red-500/20 text-red-400",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${colors[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}
```

- [ ] **Step 5: Write Sidebar**

```tsx
// frontend/src/components/layout/Sidebar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, FileText, ClipboardList, Settings } from "lucide-react";
import { tokenStorage } from "@/lib/auth";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/resumes", label: "Resumes", icon: FileText },
  { href: "/applications", label: "Applications", icon: ClipboardList },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    tokenStorage.clear();
    router.push("/login");
  }

  return (
    <aside className="w-64 min-h-screen border-r border-border bg-card flex flex-col">
      <div className="p-6 border-b border-border">
        <span className="text-xl font-bold text-primary">PAT</span>
        <p className="text-xs text-muted-foreground mt-1">Application Tracker</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname.startsWith(href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="w-full text-sm text-muted-foreground hover:text-foreground text-left px-3 py-2 rounded-lg hover:bg-accent"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 6: Write (app)/layout.tsx**

```tsx
// frontend/src/app/(app)/layout.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { tokenStorage } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!tokenStorage.getAccess()) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/
git commit -m "feat: add Next.js pages — login, dashboard, sidebar layout with dark mode"
```

---

## Task 8: Application detail page

**Files:**
- Create: `frontend/src/app/(app)/applications/[id]/page.tsx`

- [ ] **Step 1: Write application detail page**

```tsx
// frontend/src/app/(app)/applications/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { applicationsApi, exportApi, downloadBlob } from "@/lib/api";
import type { Application } from "@/types/api";

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    applicationsApi.get(id)
      .then((r) => setApp(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDownload(
    type: "resume" | "cover_letter",
    format: "tex" | "pdf"
  ) {
    const key = `${type}.${format}`;
    setDownloading(key);
    try {
      const resp =
        type === "resume"
          ? format === "tex"
            ? await exportApi.resumeTex(id)
            : await exportApi.resumePdf(id)
          : format === "tex"
          ? await exportApi.coverLetterTex(id)
          : await exportApi.coverLetterPdf(id);
      downloadBlob(resp.data as Blob, `${type}_${id.slice(0, 8)}.${format}`);
    } catch {
      alert(`Download failed for ${key}`);
    } finally {
      setDownloading(null);
    }
  }

  if (loading) return <div className="text-muted-foreground">Loading...</div>;
  if (!app) return <div className="text-red-500">Application not found.</div>;

  const isComplete = app.status === "complete";

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Application Detail</h1>
        {app.match_score !== null && (
          <div className="text-4xl font-bold text-primary">{app.match_score}%</div>
        )}
      </div>

      <ProgressBar label="Match Score" value={app.match_score ?? 0} />

      {/* ── LaTeX / PDF Download-Buttons ── */}
      {isComplete && (
        <div className="p-4 rounded-xl border border-border bg-card">
          <h2 className="font-semibold mb-3">Downloads</h2>
          <div className="flex flex-wrap gap-2">
            {(["resume", "cover_letter"] as const).map((docType) =>
              (["tex", "pdf"] as const).map((fmt) => {
                const key = `${docType}.${fmt}`;
                const label =
                  docType === "resume"
                    ? fmt === "tex" ? "Lebenslauf .tex" : "Lebenslauf .pdf"
                    : fmt === "tex" ? "Anschreiben .tex" : "Anschreiben .pdf";
                return (
                  <button
                    key={key}
                    onClick={() => handleDownload(docType, fmt)}
                    disabled={downloading === key}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                      ${fmt === "pdf"
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      } disabled:opacity-50`}
                  >
                    {downloading === key ? "…" : label}
                  </button>
                );
              })
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            .tex = LaTeX-Quelltext (editierbar) · .pdf = direkt druckfertiges Dokument
          </p>
        </div>
      )}

      <Section title="Strengths" items={app.strengths} color="text-green-400" />
      <Section title="Weaknesses" items={app.weaknesses} color="text-red-400" />
      <Section title="Skill Gaps" items={app.skill_gaps} color="text-yellow-400" />
      <Section title="Suggestions" items={app.suggestions} color="text-blue-400" />

      {app.cover_letter && (
        <div className="p-6 rounded-xl border border-border bg-card">
          <h2 className="font-semibold mb-3">Cover Letter</h2>
          <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans">{app.cover_letter}</pre>
        </div>
      )}

      {app.interview_questions && app.interview_questions.length > 0 && (
        <div className="p-6 rounded-xl border border-border bg-card">
          <h2 className="font-semibold mb-3">Interview Questions</h2>
          <ul className="space-y-2">
            {app.interview_questions.map((q, i) => (
              <li key={i} className="text-sm text-muted-foreground">• {q}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Section({ title, items, color }: { title: string; items?: string[] | null; color: string }) {
  if (!items?.length) return null;
  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <h2 className={`font-semibold mb-2 ${color}`}>{title}</h2>
      <ul className="space-y-1">
        {items.map((item, i) => <li key={i} className="text-sm">• {item}</li>)}
      </ul>
    </div>
  );
}

function ProgressBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="w-full h-3 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/ frontend/src/lib/api.ts
git commit -m "feat: add application detail page with match score, skill gaps, cover letter and LaTeX/PDF download buttons"
```

---

## Phase 5 Complete

Full stack now running:
- Semantic matching engine with Qdrant
- Telegram bot accepting jobs via URL/text/PDF/photo
- Next.js frontend with dashboard, jobs, applications, dark mode

```bash
docker compose up -d
# Open http://localhost:3000
```

**Remaining:** Add document export (PDF/DOCX), AI config settings UI, rate limiting, and final production hardening.
