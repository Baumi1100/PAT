# PAT Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         External Inputs                              │
│  Telegram Bot  │  Web Dashboard  │  (Future: Indeed/LinkedIn/RSS)   │
└───────┬────────┴────────┬────────┴──────────────────────────────────┘
        │                 │
        │        ┌────────▼────────────────────────────────────────┐
        │        │        Next.js 15 Frontend (TypeScript)          │
        │        │  App Router — route groups: (app) / (auth)       │
        │        │  Pages: Dashboard · Jobs · Applications          │
        │        │         Resumes · Certificates · Settings        │
        │        │  DM Sans · Tailwind CSS · Lucide icons           │
        │        │  Fontsource (bundled, no external font CDN)      │
        │        └────────┬────────────────────────────────────────┘
        │                 │  REST  /api/v1/*
        ▼                 ▼
┌───────────────────────────────────────────────────────────────────┐
│                     FastAPI Backend (Python 3.12)                  │
│                                                                     │
│  API Layer:  /api/v1/{auth,users,resumes,jobs,applications,health} │
│  Service Layer:  AuthService | ResumeService | JobService | ...    │
│  Repository Layer:  UserRepo | ResumeRepo | JobRepo | AppRepo      │
│                                                                     │
│  ┌──────────────────────┐   ┌──────────────────────────────────┐   │
│  │  Document Processing  │   │       AI Agent Pipeline          │   │
│  │  PDF → PyMuPDF       │   │  1. ResumeParserAgent            │   │
│  │  DOCX → python-docx  │   │  2. JobAnalyzerAgent             │   │
│  │  IMG → Tesseract OCR │   │  3. ATSKeywordAgent              │   │
│  └──────────────────────┘   │  4. MatchScorerAgent             │   │
│                              │  5. ResumeOptimizerAgent         │   │
│  ┌──────────────────────┐   │  6. CoverLetterAgent             │   │
│  │   Matching Engine     │   │  7. InterviewQuestionsAgent      │   │
│  │  Qdrant Embeddings   │   │  8. SkillGapAgent                │   │
│  │  Keyword Overlap     │   └──────────────────────────────────┘   │
│  │  Experience Score    │                                           │
│  └──────────────────────┘   ┌──────────────────────────────────┐   │
│                              │     AI Provider Abstraction       │   │
│                              │  OpenAI | Anthropic | Ollama     │   │
│                              │  ProviderRegistry (per-task)     │   │
│                              └──────────────────────────────────┘   │
└───────────────────────────┬───────────────────────────────────────┘
                            │ async tasks
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                    Celery Workers (Python)                          │
│  analyze_job_task | analyze_resume_task | generate_application     │
└───────────────────────────────────────────────────────────────────┘

Infrastructure (Docker Compose):
┌────────────┐ ┌────────────┐ ┌─────────────┐ ┌────────────────┐
│ PostgreSQL  │ │   Redis    │ │   Qdrant    │ │ Ollama (opt.)  │
│ (data)     │ │ (broker +  │ │ (vector DB) │ │ (local models) │
│            │ │  cache)    │ │             │ │                │
└────────────┘ └────────────┘ └─────────────┘ └────────────────┘
```

## Key Architectural Decisions

### 1. AI Provider Abstraction
**Decision:** `AIProvider` Protocol + `ProviderRegistry` instead of direct SDK calls anywhere.
**Why:** The AI provider landscape changes fast. Swapping OpenAI for a new provider should touch exactly one file (`openai_provider.py`), not 8 agent files. The registry resolves provider+model per task type, supporting per-user overrides.

### 2. Specialized AI Agents (not one mega-prompt)
**Decision:** 8 separate agents, each with a single responsibility.
**Why:** Monolithic prompts produce inconsistent outputs and are hard to tune. Agents with focused system prompts + Pydantic-validated JSON outputs are predictable, testable, and independently improvable. The pipeline can be parallelized or short-circuited.

### 3. Repository + Service Pattern
**Decision:** Repository handles DB queries; Service handles business logic; Router handles HTTP.
**Why:** Testability — services can be unit-tested with mock repositories. Separation of concerns — adding a new data source (e.g. DynamoDB) only requires a new repository implementation.

### 4. Celery for AI Pipelines
**Decision:** AI analysis runs as background Celery tasks, not inline HTTP requests.
**Why:** A full 8-agent pipeline takes 20-60 seconds. HTTP requests must not block. Celery provides retry semantics, progress tracking via `task_track_started`, and horizontal scalability.

### 5. Structured Pydantic Outputs from Agents
**Decision:** Every agent injects its output schema as JSON Schema into the system prompt and validates the response with `model_validate`.
**Why:** Unstructured LLM text is useless to downstream code. Pydantic validation catches hallucinated/malformed JSON at the agent boundary, enabling clean retry logic.

### 6. Soft Deletes on User Data
**Decision:** `deleted_at` timestamp rather than `DELETE` on jobs, resumes, and applications.
**Why:** Job application data is sensitive and legally relevant. Audit trails matter. Hard delete can be a scheduled job running against `deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days'`.

## Data Flow: Submit Job via Telegram

```
User → Telegram Bot
  → url_extractor fetches page text
  → POST /api/v1/jobs/ (creates Job, status="new")
  → POST /api/v1/applications/ (creates Application, status="pending")
  → generate_application_task.delay(application_id, ...)
  → Celery Worker:
      1. ResumeParserAgent.parse(resume_text) → ParsedResume
      2. JobAnalyzerAgent.analyze(job_text) → ParsedJob
      3. ATSKeywordAgent.analyze(resume, job) → ATSKeywordAnalysis
      4. MatchScorerAgent.score(resume, job) → MatchResult
      5. ResumeOptimizerAgent.optimize(...) → OptimizedResume
      6. CoverLetterAgent.generate(...) → CoverLetter
      7. InterviewQuestionsAgent.generate(...) → InterviewQuestions
      8. SkillGapAgent.analyze(...) → SkillGapReport
      9. upsert_resume_embedding() → Qdrant
      10. compute_combined_match_score() → float
      11. UPDATE applications SET status='complete', match_score=..., ...
  → Frontend polls application status
  → User sees match score, skill gaps, cover letter, interview prep
```

## Database Schema (simplified)

```
users
  id, email, hashed_password, full_name, is_active, is_superuser,
  telegram_chat_id, profile_text

resumes
  id, user_id → users, title, raw_text, file_path, parsed_data (JSON),
  is_primary, deleted_at

work_certificates
  id, user_id → users, title, company, file_path, uploaded_at

jobs
  id, user_id → users, title, company, location, url, raw_text,
  source, source_platform, parsed_data (JSON), status,
  salary_range, remote_policy, employment_type, seniority_level,
  priority, notes, contact_person, applied_at, deleted_at

applications
  id, user_id → users, job_id → jobs, resume_id → resumes,
  match_score, strengths/weaknesses/skill_gaps/suggestions (JSON arrays),
  optimized_resume (JSON), cover_letter, interview_questions (JSON),
  status, celery_task_id, error_message, deleted_at

ai_provider_configs
  id, user_id → users, task_type UNIQUE(user_id, task_type),
  provider, model, is_active, extra_params (JSON)
```

## AI Provider Configuration

Users can override the default model per task via the Settings UI:

| Task | Default Provider | Default Model |
|------|-----------------|---------------|
| resume_parsing | openai | gpt-4.1 |
| job_analysis | openai | gpt-4.1 |
| ats_keywords | openai | gpt-4.1 |
| match_scoring | openai | gpt-4.1 |
| resume_optimization | openai | gpt-4.1 |
| cover_letter | anthropic | claude-sonnet-4-6 |
| interview_questions | anthropic | claude-sonnet-4-6 |
| skill_gap | openai | gpt-4.1 |

Override example: use Ollama/qwen3 for all tasks (privacy mode — no data leaves your machine).
