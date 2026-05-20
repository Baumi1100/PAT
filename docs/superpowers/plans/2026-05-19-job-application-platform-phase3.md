# Job Application Platform — Phase 3: AI Provider Abstraction + 8 AI Agents

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the provider-agnostic AI layer with OpenAI, Anthropic, and Ollama implementations, then implement all 8 specialized AI agents with structured Pydantic outputs. No agent should do more than one job. No raw LLM text — all outputs are typed.

**Architecture:** Abstract `AIProvider` protocol defines the contract. A `ProviderRegistry` resolves the correct provider+model per task type using the user's `AIProviderConfig` (or system defaults). Each agent takes structured input, calls the provider, validates the JSON response, and returns a typed Pydantic model.

**Tech Stack:** openai>=1.30, anthropic>=0.28, httpx (Ollama), tenacity for retries, Pydantic v2 structured outputs. Agents 5 (ResumeOptimizer) und 6 (CoverLetter) geben zusätzlich valides LaTeX aus — `latex_source`-Feld im jeweiligen Schema — damit Phase 4 daraus per `xelatex` ein PDF kompilieren kann.

**Prerequisite:** Phases 1 and 2 complete.

---

## File Map

```
backend/app/ai/
├── __init__.py
├── base.py                    # AIProvider Protocol + CompletionRequest
├── registry.py                # ProviderRegistry: resolves provider by task_type
├── providers/
│   ├── __init__.py
│   ├── openai_provider.py
│   ├── anthropic_provider.py
│   └── ollama_provider.py
├── agents/
│   ├── __init__.py
│   ├── base_agent.py          # BaseAgent with retry + structured output parsing
│   ├── resume_parser.py       # Agent 1
│   ├── job_analyzer.py        # Agent 2
│   ├── ats_keyword.py         # Agent 3
│   ├── match_scorer.py        # Agent 4
│   ├── resume_optimizer.py    # Agent 5
│   ├── cover_letter.py        # Agent 6
│   ├── interview_questions.py # Agent 7
│   └── skill_gap.py           # Agent 8
└── schemas/
    ├── __init__.py
    ├── resume_schemas.py      # ParsedResume, ResumeSection, etc.
    ├── job_schemas.py         # ParsedJob, JobRequirements, etc.
    ├── match_schemas.py       # MatchResult, SkillGapReport
    ├── document_schemas.py    # OptimizedResume (+ latex_source), CoverLetter (+ latex_source), InterviewQuestions
    └── latex_templates.py     # Jinja2-Basis-Templates für Resume + CoverLetter

tests/unit/ai/
├── test_openai_provider.py
├── test_resume_parser_agent.py
└── test_match_scorer_agent.py
```

---

## Task 1: AI output schemas (Pydantic)

**Files:**
- Create: `backend/app/ai/schemas/resume_schemas.py`
- Create: `backend/app/ai/schemas/job_schemas.py`
- Create: `backend/app/ai/schemas/match_schemas.py`
- Create: `backend/app/ai/schemas/document_schemas.py`

- [ ] **Step 1: Write resume_schemas.py**

```python
# backend/app/ai/schemas/resume_schemas.py
from pydantic import BaseModel, Field


class WorkExperience(BaseModel):
    company: str
    title: str
    start_date: str
    end_date: str | None = None
    is_current: bool = False
    responsibilities: list[str] = Field(default_factory=list)
    achievements: list[str] = Field(default_factory=list)
    technologies: list[str] = Field(default_factory=list)


class Education(BaseModel):
    institution: str
    degree: str
    field: str | None = None
    graduation_year: int | None = None


class Certification(BaseModel):
    name: str
    issuer: str | None = None
    year: int | None = None


class ParsedResume(BaseModel):
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    summary: str | None = None
    skills: list[str] = Field(default_factory=list)
    technologies: list[str] = Field(default_factory=list)
    soft_skills: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)
    work_experience: list[WorkExperience] = Field(default_factory=list)
    education: list[Education] = Field(default_factory=list)
    certifications: list[Certification] = Field(default_factory=list)
    seniority_level: str | None = None  # junior | mid | senior | lead | principal | executive
    has_leadership: bool = False
    years_of_experience: float | None = None
    industries: list[str] = Field(default_factory=list)
    projects: list[str] = Field(default_factory=list)
```

- [ ] **Step 2: Write job_schemas.py**

```python
# backend/app/ai/schemas/job_schemas.py
from pydantic import BaseModel, Field


class ParsedJob(BaseModel):
    title: str | None = None
    company: str | None = None
    location: str | None = None
    employment_type: str | None = None  # full-time, part-time, contract
    must_have_skills: list[str] = Field(default_factory=list)
    nice_to_have_skills: list[str] = Field(default_factory=list)
    ats_keywords: list[str] = Field(default_factory=list)
    technologies: list[str] = Field(default_factory=list)
    seniority_level: str | None = None
    requires_leadership: bool = False
    industry: str | None = None
    min_years_experience: int | None = None
    salary_range: str | None = None
    remote_policy: str | None = None  # onsite | hybrid | remote
    responsibilities: list[str] = Field(default_factory=list)
    benefits: list[str] = Field(default_factory=list)
    company_description: str | None = None
```

- [ ] **Step 3: Write match_schemas.py**

```python
# backend/app/ai/schemas/match_schemas.py
from pydantic import BaseModel, Field


class SkillMatch(BaseModel):
    skill: str
    matched: bool
    similarity_score: float = 0.0
    notes: str | None = None


class MatchResult(BaseModel):
    overall_score: float = Field(ge=0.0, le=100.0)
    skill_score: float = Field(ge=0.0, le=100.0)
    experience_score: float = Field(ge=0.0, le=100.0)
    keyword_score: float = Field(ge=0.0, le=100.0)
    seniority_match: bool = False
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    skill_matches: list[SkillMatch] = Field(default_factory=list)
    summary: str = ""


class SkillGapReport(BaseModel):
    critical_gaps: list[str] = Field(default_factory=list)   # must-have skills missing
    optional_gaps: list[str] = Field(default_factory=list)    # nice-to-have missing
    suggestions: list[str] = Field(default_factory=list)      # actionable improvements
    learning_resources: list[str] = Field(default_factory=list)
    estimated_gap_closure_weeks: int | None = None
```

- [ ] **Step 4: Write document_schemas.py**

```python
# backend/app/ai/schemas/document_schemas.py
from pydantic import BaseModel, Field


class ResumeSection(BaseModel):
    heading: str
    content: list[str]  # bullet points or paragraphs


class OptimizedResumeBullet(BaseModel):
    original: str | None = None
    optimized: str
    keywords_added: list[str] = Field(default_factory=list)
    format: str = "STAR"  # STAR | achievement | responsibility


class OptimizedResume(BaseModel):
    summary: str
    skills_section: list[str]
    experience_sections: list[ResumeSection]
    keywords_injected: list[str] = Field(default_factory=list)
    ats_score_estimate: float | None = None
    formatting_notes: list[str] = Field(default_factory=list)
    latex_source: str = ""  # vollständiges .tex-Dokument, von Phase 4 direkt nach PDF kompilierbar


class CoverLetter(BaseModel):
    subject: str
    salutation: str
    opening_paragraph: str
    body_paragraphs: list[str]
    closing_paragraph: str
    sign_off: str
    full_text: str
    latex_source: str = ""  # vollständiges .tex-Dokument


class InterviewQuestions(BaseModel):
    technical_questions: list[str] = Field(default_factory=list)
    behavioral_questions: list[str] = Field(default_factory=list)
    situational_questions: list[str] = Field(default_factory=list)
    company_specific_questions: list[str] = Field(default_factory=list)
    questions_to_ask_interviewer: list[str] = Field(default_factory=list)


class ATSKeywordAnalysis(BaseModel):
    high_priority_keywords: list[str] = Field(default_factory=list)
    medium_priority_keywords: list[str] = Field(default_factory=list)
    keywords_present_in_resume: list[str] = Field(default_factory=list)
    keywords_missing_from_resume: list[str] = Field(default_factory=list)
    keyword_density_score: float = Field(ge=0.0, le=100.0, default=0.0)
```

- [ ] **Step 5: Write latex_templates.py**

```python
# backend/app/ai/schemas/latex_templates.py
"""
Jinja2-Basis-Templates für LaTeX-Ausgabe der Agents.
Die Agents füllen diese Templates mit ihren strukturierten Daten,
bevor sie latex_source ins Schema schreiben.
Phase 4 kompiliert latex_source → PDF via xelatex.
"""
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
```

- [ ] **Step 6: Commit**

```bash
git add backend/app/ai/schemas/
git commit -m "feat: add typed Pydantic schemas for all AI agent outputs incl. latex_source fields"
```

---

## Task 2: AIProvider protocol and base types

**Files:**
- Create: `backend/app/ai/base.py`

- [ ] **Step 1: Write base.py**

```python
# backend/app/ai/base.py
from typing import Any, Protocol, runtime_checkable
from pydantic import BaseModel


class CompletionMessage(BaseModel):
    role: str  # system | user | assistant
    content: str


class CompletionRequest(BaseModel):
    messages: list[CompletionMessage]
    model: str
    temperature: float = 0.1
    max_tokens: int = 4096
    response_format: str = "json_object"  # json_object | text


class CompletionResponse(BaseModel):
    content: str
    model: str
    input_tokens: int = 0
    output_tokens: int = 0
    provider: str


@runtime_checkable
class AIProvider(Protocol):
    provider_name: str

    async def complete(self, request: CompletionRequest) -> CompletionResponse: ...

    async def health_check(self) -> bool: ...

    def list_models(self) -> list[str]: ...
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/ai/base.py
git commit -m "feat: add AIProvider Protocol and CompletionRequest/Response types"
```

---

## Task 3: OpenAI provider

**Files:**
- Create: `backend/app/ai/providers/openai_provider.py`
- Create: `backend/tests/unit/ai/test_openai_provider.py`

- [ ] **Step 1: Write failing test**

```python
# backend/tests/unit/ai/test_openai_provider.py
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.ai.providers.openai_provider import OpenAIProvider
from app.ai.base import CompletionRequest, CompletionMessage


@pytest.fixture
def provider():
    return OpenAIProvider(api_key="test-key")


@pytest.mark.asyncio
async def test_complete_returns_response(provider):
    mock_response = MagicMock()
    mock_response.choices[0].message.content = '{"result": "ok"}'
    mock_response.model = "gpt-4o"
    mock_response.usage.prompt_tokens = 10
    mock_response.usage.completion_tokens = 5

    with patch.object(provider._client.chat.completions, "create", new=AsyncMock(return_value=mock_response)):
        req = CompletionRequest(
            messages=[CompletionMessage(role="user", content="hello")],
            model="gpt-4o",
        )
        resp = await provider.complete(req)
        assert resp.content == '{"result": "ok"}'
        assert resp.provider == "openai"


def test_list_models(provider):
    models = provider.list_models()
    assert "gpt-4o" in models
    assert "gpt-4.1" in models
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd backend && python -m pytest tests/unit/ai/test_openai_provider.py -v
```
Expected: `ImportError`

- [ ] **Step 3: Add openai to pyproject.toml dependencies**

In `backend/pyproject.toml`, add to `dependencies`:
```
"openai>=1.30.0",
"anthropic>=0.28.0",
```

- [ ] **Step 4: Write openai_provider.py**

```python
# backend/app/ai/providers/openai_provider.py
from openai import AsyncOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential
from app.ai.base import AIProvider, CompletionRequest, CompletionResponse

_OPENAI_MODELS = [
    "gpt-4.1",
    "gpt-4.1-mini",
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
]


class OpenAIProvider:
    provider_name = "openai"

    def __init__(self, api_key: str, base_url: str | None = None) -> None:
        self._client = AsyncOpenAI(api_key=api_key, base_url=base_url)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def complete(self, request: CompletionRequest) -> CompletionResponse:
        kwargs: dict = {
            "model": request.model,
            "messages": [m.model_dump() for m in request.messages],
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
        }
        if request.response_format == "json_object":
            kwargs["response_format"] = {"type": "json_object"}

        response = await self._client.chat.completions.create(**kwargs)
        return CompletionResponse(
            content=response.choices[0].message.content or "",
            model=response.model,
            input_tokens=response.usage.prompt_tokens if response.usage else 0,
            output_tokens=response.usage.completion_tokens if response.usage else 0,
            provider=self.provider_name,
        )

    async def health_check(self) -> bool:
        try:
            await self._client.models.list()
            return True
        except Exception:
            return False

    def list_models(self) -> list[str]:
        return _OPENAI_MODELS
```

- [ ] **Step 5: Run tests**

```bash
cd backend && python -m pytest tests/unit/ai/test_openai_provider.py -v
```
Expected: 2 PASSED

- [ ] **Step 6: Commit**

```bash
git add backend/app/ai/providers/openai_provider.py backend/tests/unit/ai/test_openai_provider.py backend/pyproject.toml
git commit -m "feat: add OpenAI provider with retry logic"
```

---

## Task 4: Anthropic provider

**Files:**
- Create: `backend/app/ai/providers/anthropic_provider.py`

- [ ] **Step 1: Write anthropic_provider.py**

```python
# backend/app/ai/providers/anthropic_provider.py
import json
from anthropic import AsyncAnthropic
from tenacity import retry, stop_after_attempt, wait_exponential
from app.ai.base import CompletionRequest, CompletionResponse

_ANTHROPIC_MODELS = [
    "claude-sonnet-4-6",
    "claude-opus-4-7",
    "claude-haiku-4-5-20251001",
]


class AnthropicProvider:
    provider_name = "anthropic"

    def __init__(self, api_key: str) -> None:
        self._client = AsyncAnthropic(api_key=api_key)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def complete(self, request: CompletionRequest) -> CompletionResponse:
        # Anthropic separates system message from user messages
        system_content = ""
        messages = []
        for msg in request.messages:
            if msg.role == "system":
                system_content = msg.content
            else:
                messages.append({"role": msg.role, "content": msg.content})

        if not messages:
            messages = [{"role": "user", "content": "Continue."}]

        # Instruct JSON output via system prompt when requested
        if request.response_format == "json_object" and system_content:
            system_content += "\n\nRespond with valid JSON only. No markdown, no explanation."
        elif request.response_format == "json_object":
            system_content = "Respond with valid JSON only. No markdown, no explanation."

        kwargs: dict = {
            "model": request.model,
            "max_tokens": request.max_tokens,
            "messages": messages,
        }
        if system_content:
            kwargs["system"] = system_content

        response = await self._client.messages.create(**kwargs)
        content = response.content[0].text if response.content else ""
        return CompletionResponse(
            content=content,
            model=response.model,
            input_tokens=response.usage.input_tokens,
            output_tokens=response.usage.output_tokens,
            provider=self.provider_name,
        )

    async def health_check(self) -> bool:
        try:
            # Minimal test call
            await self._client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=10,
                messages=[{"role": "user", "content": "ping"}],
            )
            return True
        except Exception:
            return False

    def list_models(self) -> list[str]:
        return _ANTHROPIC_MODELS
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/ai/providers/anthropic_provider.py
git commit -m "feat: add Anthropic Claude provider"
```

---

## Task 5: Ollama provider

**Files:**
- Create: `backend/app/ai/providers/ollama_provider.py`

- [ ] **Step 1: Write ollama_provider.py**

```python
# backend/app/ai/providers/ollama_provider.py
import json
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
from app.ai.base import CompletionRequest, CompletionResponse

_DEFAULT_OLLAMA_MODELS = ["qwen3", "llama3", "deepseek-r1", "mistral", "gemma3"]


class OllamaProvider:
    provider_name = "ollama"

    def __init__(self, base_url: str = "http://localhost:11434", timeout: int = 120) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=1, max=5))
    async def complete(self, request: CompletionRequest) -> CompletionResponse:
        payload: dict = {
            "model": request.model,
            "messages": [m.model_dump() for m in request.messages],
            "stream": False,
            "options": {"temperature": request.temperature},
        }
        if request.response_format == "json_object":
            payload["format"] = "json"

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.post(f"{self._base_url}/api/chat", json=payload)
            response.raise_for_status()
            data = response.json()

        content = data.get("message", {}).get("content", "")
        return CompletionResponse(
            content=content,
            model=request.model,
            input_tokens=data.get("prompt_eval_count", 0),
            output_tokens=data.get("eval_count", 0),
            provider=self.provider_name,
        )

    async def health_check(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(f"{self._base_url}/api/version")
                return resp.status_code == 200
        except Exception:
            return False

    async def list_available_models(self) -> list[str]:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(f"{self._base_url}/api/tags")
                resp.raise_for_status()
                return [m["name"] for m in resp.json().get("models", [])]
        except Exception:
            return []

    async def pull_model(self, model: str) -> bool:
        try:
            async with httpx.AsyncClient(timeout=600) as client:
                async with client.stream(
                    "POST", f"{self._base_url}/api/pull", json={"name": model}
                ) as resp:
                    async for line in resp.aiter_lines():
                        if line:
                            data = json.loads(line)
                            if data.get("status") == "success":
                                return True
            return True
        except Exception:
            return False

    def list_models(self) -> list[str]:
        return _DEFAULT_OLLAMA_MODELS
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/ai/providers/ollama_provider.py
git commit -m "feat: add Ollama provider with pull-management and health check"
```

---

## Task 6: Provider registry

**Files:**
- Create: `backend/app/ai/registry.py`

- [ ] **Step 1: Write registry.py**

```python
# backend/app/ai/registry.py
from typing import TYPE_CHECKING
from app.ai.base import AIProvider
from app.ai.providers.openai_provider import OpenAIProvider
from app.ai.providers.anthropic_provider import AnthropicProvider
from app.ai.providers.ollama_provider import OllamaProvider
from app.config import get_settings

# Default model per task type — used when user has no custom AIProviderConfig
TASK_DEFAULTS: dict[str, tuple[str, str]] = {
    "resume_parsing":       ("openai", "gpt-4.1"),
    "job_analysis":         ("openai", "gpt-4.1"),
    "ats_keywords":         ("openai", "gpt-4.1"),
    "match_scoring":        ("openai", "gpt-4.1"),
    "resume_optimization":  ("openai", "gpt-4.1"),
    "cover_letter":         ("anthropic", "claude-sonnet-4-6"),
    "interview_questions":  ("anthropic", "claude-sonnet-4-6"),
    "skill_gap":            ("openai", "gpt-4.1"),
}


class ProviderRegistry:
    def __init__(self) -> None:
        self._settings = get_settings()
        self._providers: dict[str, AIProvider] = {}
        self._initialized = False

    def _build_providers(self) -> None:
        if self._settings.openai_api_key:
            self._providers["openai"] = OpenAIProvider(api_key=self._settings.openai_api_key)
        if self._settings.anthropic_api_key:
            self._providers["anthropic"] = AnthropicProvider(api_key=self._settings.anthropic_api_key)
        self._providers["ollama"] = OllamaProvider(base_url=self._settings.ollama_base_url)
        self._initialized = True

    def get(self, provider_name: str) -> AIProvider:
        if not self._initialized:
            self._build_providers()
        provider = self._providers.get(provider_name)
        if not provider:
            raise ValueError(f"Provider '{provider_name}' not configured. Check API keys in .env.")
        return provider

    def get_for_task(
        self,
        task_type: str,
        user_provider: str | None = None,
        user_model: str | None = None,
    ) -> tuple[AIProvider, str]:
        """Return (provider, model) — user config overrides defaults."""
        if not self._initialized:
            self._build_providers()
        if user_provider and user_model:
            return self.get(user_provider), user_model
        default_provider_name, default_model = TASK_DEFAULTS.get(task_type, ("openai", "gpt-4.1"))
        return self.get(default_provider_name), default_model

    async def health_check_all(self) -> dict[str, bool]:
        if not self._initialized:
            self._build_providers()
        results = {}
        for name, provider in self._providers.items():
            results[name] = await provider.health_check()
        return results


# Singleton — shared across the application
provider_registry = ProviderRegistry()
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/ai/registry.py
git commit -m "feat: add ProviderRegistry with per-task defaults and user overrides"
```

---

## Task 7: BaseAgent

**Files:**
- Create: `backend/app/ai/agents/base_agent.py`

- [ ] **Step 1: Write base_agent.py**

```python
# backend/app/ai/agents/base_agent.py
import json
import structlog
from typing import Any, TypeVar
from pydantic import BaseModel, ValidationError
from app.ai.base import AIProvider, CompletionMessage, CompletionRequest
from app.ai.registry import ProviderRegistry, provider_registry

log = structlog.get_logger()
OutputT = TypeVar("OutputT", bound=BaseModel)


class BaseAgent:
    task_type: str = ""
    system_prompt: str = ""

    def __init__(self, registry: ProviderRegistry | None = None) -> None:
        self._registry = registry or provider_registry

    async def _call(
        self,
        user_message: str,
        output_schema: type[OutputT],
        user_provider: str | None = None,
        user_model: str | None = None,
        temperature: float = 0.1,
        max_tokens: int = 4096,
    ) -> OutputT:
        provider, model = self._registry.get_for_task(
            self.task_type, user_provider, user_model
        )
        schema_hint = output_schema.model_json_schema()
        system = (
            f"{self.system_prompt}\n\n"
            f"You MUST respond with a valid JSON object matching this schema:\n"
            f"{json.dumps(schema_hint, indent=2)}\n"
            "Do not include any text outside the JSON object."
        )
        request = CompletionRequest(
            messages=[
                CompletionMessage(role="system", content=system),
                CompletionMessage(role="user", content=user_message),
            ],
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format="json_object",
        )
        response = await provider.complete(request)
        log.info(
            "agent.call",
            agent=self.__class__.__name__,
            provider=provider.provider_name,
            model=model,
            input_tokens=response.input_tokens,
            output_tokens=response.output_tokens,
        )
        return self._parse_output(response.content, output_schema)

    @staticmethod
    def _parse_output(raw: str, schema: type[OutputT]) -> OutputT:
        try:
            data = json.loads(raw)
            return schema.model_validate(data)
        except (json.JSONDecodeError, ValidationError) as exc:
            raise ValueError(f"Agent returned invalid output: {exc}\nRaw: {raw[:500]}") from exc
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/ai/agents/base_agent.py
git commit -m "feat: add BaseAgent with structured output parsing and schema injection"
```

---

## Task 8: Resume Parser Agent (Agent 1)

**Files:**
- Create: `backend/app/ai/agents/resume_parser.py`
- Create: `backend/tests/unit/ai/test_resume_parser_agent.py`

- [ ] **Step 1: Write failing test**

```python
# backend/tests/unit/ai/test_resume_parser_agent.py
import pytest
import json
from unittest.mock import AsyncMock, patch
from app.ai.agents.resume_parser import ResumeParserAgent
from app.ai.schemas.resume_schemas import ParsedResume


@pytest.mark.asyncio
async def test_parse_resume_returns_parsed_resume():
    agent = ResumeParserAgent()
    mock_output = ParsedResume(
        full_name="Jane Doe",
        email="jane@example.com",
        skills=["Python", "FastAPI"],
        seniority_level="senior",
        years_of_experience=7.0,
    )
    with patch.object(agent, "_call", new=AsyncMock(return_value=mock_output)):
        result = await agent.parse("Jane Doe\nPython developer, 7 years experience")
        assert result.full_name == "Jane Doe"
        assert "Python" in result.skills
        assert result.seniority_level == "senior"
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd backend && python -m pytest tests/unit/ai/test_resume_parser_agent.py -v
```
Expected: `ImportError`

- [ ] **Step 3: Write resume_parser.py**

```python
# backend/app/ai/agents/resume_parser.py
from app.ai.agents.base_agent import BaseAgent
from app.ai.schemas.resume_schemas import ParsedResume


class ResumeParserAgent(BaseAgent):
    task_type = "resume_parsing"
    system_prompt = (
        "You are an expert resume parser for a recruiting platform. "
        "Extract all structured information from the resume text provided. "
        "Be thorough: capture all skills, technologies, work history, education, "
        "certifications, and infer seniority level and years of experience. "
        "For seniority_level use: junior | mid | senior | lead | principal | executive. "
        "Normalize technology names (e.g. 'JS' → 'JavaScript', 'k8s' → 'Kubernetes')."
    )

    async def parse(
        self,
        resume_text: str,
        user_provider: str | None = None,
        user_model: str | None = None,
    ) -> ParsedResume:
        return await self._call(
            user_message=f"Parse this resume:\n\n{resume_text}",
            output_schema=ParsedResume,
            user_provider=user_provider,
            user_model=user_model,
        )
```

- [ ] **Step 4: Run tests**

```bash
cd backend && python -m pytest tests/unit/ai/test_resume_parser_agent.py -v
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/ai/agents/resume_parser.py backend/tests/unit/ai/test_resume_parser_agent.py
git commit -m "feat: add ResumeParserAgent (Agent 1)"
```

---

## Task 9: Job Analyzer Agent (Agent 2)

**Files:**
- Create: `backend/app/ai/agents/job_analyzer.py`

- [ ] **Step 1: Write job_analyzer.py**

```python
# backend/app/ai/agents/job_analyzer.py
from app.ai.agents.base_agent import BaseAgent
from app.ai.schemas.job_schemas import ParsedJob


class JobAnalyzerAgent(BaseAgent):
    task_type = "job_analysis"
    system_prompt = (
        "You are an expert job posting analyzer for a recruiting platform. "
        "Extract all structured requirements from the job posting. "
        "Separate must-have from nice-to-have requirements rigorously. "
        "Extract ATS keywords — these are exact phrases that ATS systems scan for. "
        "For seniority_level use: junior | mid | senior | lead | principal | executive. "
        "Normalize technology names."
    )

    async def analyze(
        self,
        job_text: str,
        user_provider: str | None = None,
        user_model: str | None = None,
    ) -> ParsedJob:
        return await self._call(
            user_message=f"Analyze this job posting:\n\n{job_text}",
            output_schema=ParsedJob,
            user_provider=user_provider,
            user_model=user_model,
        )
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/ai/agents/job_analyzer.py
git commit -m "feat: add JobAnalyzerAgent (Agent 2)"
```

---

## Task 10: ATS Keyword Agent (Agent 3)

**Files:**
- Create: `backend/app/ai/agents/ats_keyword.py`

- [ ] **Step 1: Write ats_keyword.py**

```python
# backend/app/ai/agents/ats_keyword.py
import json
from app.ai.agents.base_agent import BaseAgent
from app.ai.schemas.document_schemas import ATSKeywordAnalysis
from app.ai.schemas.resume_schemas import ParsedResume
from app.ai.schemas.job_schemas import ParsedJob


class ATSKeywordAgent(BaseAgent):
    task_type = "ats_keywords"
    system_prompt = (
        "You are an ATS (Applicant Tracking System) keyword optimization expert. "
        "Given a parsed resume and a parsed job posting, identify which high-priority ATS "
        "keywords appear in the resume and which are missing. "
        "High priority = must-have skills and technologies. "
        "Medium priority = nice-to-have and common industry terms. "
        "Calculate a keyword density score from 0-100 based on coverage of high-priority keywords."
    )

    async def analyze(
        self,
        resume: ParsedResume,
        job: ParsedJob,
        user_provider: str | None = None,
        user_model: str | None = None,
    ) -> ATSKeywordAnalysis:
        message = (
            f"Resume skills and technologies:\n{json.dumps(resume.skills + resume.technologies)}\n\n"
            f"Job must-have skills: {json.dumps(job.must_have_skills)}\n"
            f"Job nice-to-have: {json.dumps(job.nice_to_have_skills)}\n"
            f"Job ATS keywords: {json.dumps(job.ats_keywords)}\n"
            f"Job technologies: {json.dumps(job.technologies)}"
        )
        return await self._call(
            user_message=message,
            output_schema=ATSKeywordAnalysis,
            user_provider=user_provider,
            user_model=user_model,
        )
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/ai/agents/ats_keyword.py
git commit -m "feat: add ATSKeywordAgent (Agent 3)"
```

---

## Task 11: Match Scorer Agent (Agent 4)

**Files:**
- Create: `backend/app/ai/agents/match_scorer.py`
- Create: `backend/tests/unit/ai/test_match_scorer_agent.py`

- [ ] **Step 1: Write failing test**

```python
# backend/tests/unit/ai/test_match_scorer_agent.py
import pytest
from unittest.mock import AsyncMock, patch
from app.ai.agents.match_scorer import MatchScorerAgent
from app.ai.schemas.match_schemas import MatchResult
from app.ai.schemas.resume_schemas import ParsedResume
from app.ai.schemas.job_schemas import ParsedJob


@pytest.mark.asyncio
async def test_score_returns_match_result():
    agent = MatchScorerAgent()
    mock_result = MatchResult(
        overall_score=82.5,
        skill_score=90.0,
        experience_score=75.0,
        keyword_score=80.0,
        seniority_match=True,
        strengths=["Strong Python skills"],
        weaknesses=["Missing Kubernetes experience"],
        summary="Strong candidate.",
    )
    resume = ParsedResume(skills=["Python", "FastAPI"], seniority_level="senior")
    job = ParsedJob(must_have_skills=["Python", "Kubernetes"], seniority_level="senior")

    with patch.object(agent, "_call", new=AsyncMock(return_value=mock_result)):
        result = await agent.score(resume, job)
        assert result.overall_score == 82.5
        assert result.seniority_match is True
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd backend && python -m pytest tests/unit/ai/test_match_scorer_agent.py -v
```

- [ ] **Step 3: Write match_scorer.py**

```python
# backend/app/ai/agents/match_scorer.py
import json
from app.ai.agents.base_agent import BaseAgent
from app.ai.schemas.match_schemas import MatchResult
from app.ai.schemas.resume_schemas import ParsedResume
from app.ai.schemas.job_schemas import ParsedJob


class MatchScorerAgent(BaseAgent):
    task_type = "match_scoring"
    system_prompt = (
        "You are an expert recruiter and technical hiring manager scoring a candidate's fit "
        "for a job. Score from 0-100 for each dimension: skill_score (technical skills match), "
        "experience_score (years and relevance of experience), keyword_score (ATS keyword coverage). "
        "overall_score is the weighted average: skill 40%, experience 35%, keyword 25%. "
        "Be objective. List specific strengths and weaknesses. "
        "seniority_match is true only if candidate level matches or exceeds job requirement."
    )

    async def score(
        self,
        resume: ParsedResume,
        job: ParsedJob,
        user_provider: str | None = None,
        user_model: str | None = None,
    ) -> MatchResult:
        message = (
            f"Candidate:\n"
            f"- Skills: {resume.skills}\n"
            f"- Technologies: {resume.technologies}\n"
            f"- Years experience: {resume.years_of_experience}\n"
            f"- Seniority: {resume.seniority_level}\n"
            f"- Industries: {resume.industries}\n\n"
            f"Job:\n"
            f"- Must-have: {job.must_have_skills}\n"
            f"- Nice-to-have: {job.nice_to_have_skills}\n"
            f"- Technologies: {job.technologies}\n"
            f"- Min years: {job.min_years_experience}\n"
            f"- Required seniority: {job.seniority_level}\n"
            f"- Requires leadership: {job.requires_leadership}"
        )
        return await self._call(
            user_message=message,
            output_schema=MatchResult,
            user_provider=user_provider,
            user_model=user_model,
        )
```

- [ ] **Step 4: Run tests**

```bash
cd backend && python -m pytest tests/unit/ai/test_match_scorer_agent.py -v
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/ai/agents/match_scorer.py backend/tests/unit/ai/test_match_scorer_agent.py
git commit -m "feat: add MatchScorerAgent (Agent 4)"
```

---

## Task 12: Resume Optimizer Agent (Agent 5)

**Files:**
- Create: `backend/app/ai/agents/resume_optimizer.py`

- [ ] **Step 1: Write resume_optimizer.py**

```python
# backend/app/ai/agents/resume_optimizer.py
import json
from app.ai.agents.base_agent import BaseAgent
from app.ai.schemas.document_schemas import OptimizedResume
from app.ai.schemas.resume_schemas import ParsedResume
from app.ai.schemas.job_schemas import ParsedJob
from app.ai.schemas.document_schemas import ATSKeywordAnalysis


class ResumeOptimizerAgent(BaseAgent):
    task_type = "resume_optimization"
    system_prompt = (
        "You are an expert ATS resume writer and career coach. "
        "Rewrite and optimize the candidate's resume for the target job. "
        "Rules:\n"
        "1. Inject missing high-priority ATS keywords naturally — never stuff keywords.\n"
        "2. Rewrite all bullet points in STAR format (Situation, Task, Action, Result) "
        "with quantified achievements where possible.\n"
        "3. The summary must directly address the job requirements.\n"
        "4. Skills section must lead with the job's must-have technologies.\n"
        "5. Keep language active, recruiter-friendly, professional.\n"
        "6. Never fabricate experience or skills the candidate doesn't have.\n"
        "7. Additionally, populate the `latex_source` field with a COMPLETE, VALID LaTeX document "
        "using the documentclass `article`, package `geometry` (a4paper, 2cm margins), "
        "`enumitem`, `titlesec`, and `parskip`. "
        "The LaTeX must compile cleanly with xelatex. "
        "Escape all special LaTeX characters in user data: "
        "& → \\&, % → \\%, $ → \\$, # → \\#, _ → \\_, { → \\{, } → \\}, ~ → \\textasciitilde{}, "
        "^ → \\textasciicircum{}. "
        "Use \\section*, \\subsection*, itemize environments. "
        "Do NOT use any packages not listed above."
    )

    async def optimize(
        self,
        resume: ParsedResume,
        job: ParsedJob,
        ats_analysis: ATSKeywordAnalysis,
        user_provider: str | None = None,
        user_model: str | None = None,
    ) -> OptimizedResume:
        message = (
            f"Original Resume Summary: {resume.summary}\n"
            f"Work Experience:\n{json.dumps([e.model_dump() for e in resume.work_experience], indent=2)}\n\n"
            f"Target Job Title: {job.title} at {job.company}\n"
            f"Must-have skills: {job.must_have_skills}\n"
            f"ATS keywords missing from resume: {ats_analysis.keywords_missing_from_resume}\n"
            f"Keywords already present: {ats_analysis.keywords_present_in_resume}\n\n"
            "Optimize the resume for this specific job."
        )
        return await self._call(
            user_message=message,
            output_schema=OptimizedResume,
            user_provider=user_provider,
            user_model=user_model,
            max_tokens=8192,
        )
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/ai/agents/resume_optimizer.py
git commit -m "feat: add ResumeOptimizerAgent (Agent 5)"
```

---

## Task 13: Cover Letter Agent (Agent 6)

**Files:**
- Create: `backend/app/ai/agents/cover_letter.py`

- [ ] **Step 1: Write cover_letter.py**

```python
# backend/app/ai/agents/cover_letter.py
import json
from app.ai.agents.base_agent import BaseAgent
from app.ai.schemas.document_schemas import CoverLetter
from app.ai.schemas.resume_schemas import ParsedResume
from app.ai.schemas.job_schemas import ParsedJob


class CoverLetterAgent(BaseAgent):
    task_type = "cover_letter"
    system_prompt = (
        "You are an expert cover letter writer for senior technical and leadership roles. "
        "Write a compelling, personalized cover letter that:\n"
        "1. Opens with a specific hook referencing the company or role.\n"
        "2. Demonstrates genuine motivation for the company/role — not generic phrases.\n"
        "3. Highlights 2-3 most relevant achievements from the candidate's experience "
        "with specific metrics where available.\n"
        "4. Addresses the key technical competencies the job requires.\n"
        "5. If leadership is required, emphasizes leadership experience.\n"
        "6. Closes with a confident call to action.\n"
        "Tone: professional, confident, specific. Avoid clichés like 'passionate' or 'hardworking'. "
        "Length: 3-4 paragraphs. Also provide full_text as a single formatted string.\n"
        "Additionally, populate the `latex_source` field with a COMPLETE, VALID LaTeX document "
        "for the cover letter using documentclass `article`, packages `geometry` (a4paper, 2cm margins), "
        "`parskip`, and `babel` (ngerman or english depending on job language). "
        "Structure: flushright header with name+date, salutation, paragraphs, sign-off. "
        "Escape all special LaTeX characters in user data (same rules as for the resume). "
        "The LaTeX must compile cleanly with xelatex."
    )

    async def generate(
        self,
        resume: ParsedResume,
        job: ParsedJob,
        applicant_name: str,
        user_provider: str | None = None,
        user_model: str | None = None,
    ) -> CoverLetter:
        message = (
            f"Applicant: {applicant_name}\n"
            f"Applying for: {job.title} at {job.company or 'the company'}\n"
            f"Job description summary: {job.company_description}\n"
            f"Key requirements: {job.must_have_skills[:10]}\n"
            f"Requires leadership: {job.requires_leadership}\n\n"
            f"Candidate summary: {resume.summary}\n"
            f"Top skills: {(resume.skills + resume.technologies)[:15]}\n"
            f"Years experience: {resume.years_of_experience}\n"
            f"Seniority: {resume.seniority_level}\n"
            f"Has leadership experience: {resume.has_leadership}\n"
            f"Recent roles: {[f'{e.title} at {e.company}' for e in resume.work_experience[:3]]}"
        )
        return await self._call(
            user_message=message,
            output_schema=CoverLetter,
            user_provider=user_provider,
            user_model=user_model,
            max_tokens=2048,
        )
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/ai/agents/cover_letter.py
git commit -m "feat: add CoverLetterAgent (Agent 6)"
```

---

## Task 14: Interview Questions Agent (Agent 7) + Skill Gap Agent (Agent 8)

**Files:**
- Create: `backend/app/ai/agents/interview_questions.py`
- Create: `backend/app/ai/agents/skill_gap.py`

- [ ] **Step 1: Write interview_questions.py**

```python
# backend/app/ai/agents/interview_questions.py
import json
from app.ai.agents.base_agent import BaseAgent
from app.ai.schemas.document_schemas import InterviewQuestions
from app.ai.schemas.resume_schemas import ParsedResume
from app.ai.schemas.job_schemas import ParsedJob
from app.ai.schemas.match_schemas import MatchResult


class InterviewQuestionsAgent(BaseAgent):
    task_type = "interview_questions"
    system_prompt = (
        "You are a senior technical interviewer preparing a candidate for a job interview. "
        "Generate interview questions tailored to the specific role and candidate profile. "
        "technical_questions: deep technical questions for skills required by this role. "
        "behavioral_questions: STAR-format behavioral questions targeting the job's requirements. "
        "situational_questions: scenario-based questions relevant to this role. "
        "company_specific_questions: questions about the company's known domain/products. "
        "questions_to_ask_interviewer: smart questions the candidate should ask. "
        "Generate 4-6 questions per category."
    )

    async def generate(
        self,
        resume: ParsedResume,
        job: ParsedJob,
        match_result: MatchResult,
        user_provider: str | None = None,
        user_model: str | None = None,
    ) -> InterviewQuestions:
        message = (
            f"Role: {job.title} at {job.company}\n"
            f"Key technologies required: {job.technologies[:10]}\n"
            f"Candidate weaknesses identified: {match_result.weaknesses}\n"
            f"Candidate strengths: {match_result.strengths}\n"
            f"Candidate seniority: {resume.seniority_level}\n"
            f"Has leadership: {resume.has_leadership}\n"
            f"Job requires leadership: {job.requires_leadership}"
        )
        return await self._call(
            user_message=message,
            output_schema=InterviewQuestions,
            user_provider=user_provider,
            user_model=user_model,
        )
```

- [ ] **Step 2: Write skill_gap.py**

```python
# backend/app/ai/agents/skill_gap.py
import json
from app.ai.agents.base_agent import BaseAgent
from app.ai.schemas.match_schemas import SkillGapReport
from app.ai.schemas.resume_schemas import ParsedResume
from app.ai.schemas.job_schemas import ParsedJob
from app.ai.schemas.document_schemas import ATSKeywordAnalysis


class SkillGapAgent(BaseAgent):
    task_type = "skill_gap"
    system_prompt = (
        "You are a career development advisor analyzing a candidate's skill gaps for a target role. "
        "critical_gaps: must-have skills the candidate is missing (prioritized). "
        "optional_gaps: nice-to-have skills missing. "
        "suggestions: specific, actionable steps to close the gaps "
        "(e.g. 'Complete the AWS Solutions Architect Associate certification — takes ~3 months'). "
        "learning_resources: specific courses, certifications, or projects. "
        "estimated_gap_closure_weeks: realistic estimate if candidate studies part-time."
    )

    async def analyze(
        self,
        resume: ParsedResume,
        job: ParsedJob,
        ats_analysis: ATSKeywordAnalysis,
        user_provider: str | None = None,
        user_model: str | None = None,
    ) -> SkillGapReport:
        message = (
            f"Candidate skills: {resume.skills + resume.technologies}\n"
            f"Candidate certifications: {[c.name for c in resume.certifications]}\n"
            f"Job must-have: {job.must_have_skills}\n"
            f"Job nice-to-have: {job.nice_to_have_skills}\n"
            f"Missing high-priority keywords: {ats_analysis.keywords_missing_from_resume}"
        )
        return await self._call(
            user_message=message,
            output_schema=SkillGapReport,
            user_provider=user_provider,
            user_model=user_model,
        )
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/ai/agents/interview_questions.py backend/app/ai/agents/skill_gap.py
git commit -m "feat: add InterviewQuestionsAgent (Agent 7) and SkillGapAgent (Agent 8)"
```

---

## Task 15: Wire agents into Celery task

**Files:**
- Modify: `backend/app/tasks/generate_application.py`

- [ ] **Step 1: Update generate_application.py**

```python
# backend/app/tasks/generate_application.py
import json
import asyncio
from app.tasks.celery_app import celery_app
from app.ai.agents.resume_parser import ResumeParserAgent
from app.ai.agents.job_analyzer import JobAnalyzerAgent
from app.ai.agents.ats_keyword import ATSKeywordAgent
from app.ai.agents.match_scorer import MatchScorerAgent
from app.ai.agents.resume_optimizer import ResumeOptimizerAgent
from app.ai.agents.cover_letter import CoverLetterAgent
from app.ai.agents.interview_questions import InterviewQuestionsAgent
from app.ai.agents.skill_gap import SkillGapAgent


@celery_app.task(bind=True, name="tasks.generate_application", max_retries=2)
def generate_application_task(
    self,
    application_id: str,
    job_text: str,
    resume_text: str,
    applicant_name: str,
    user_provider: str | None = None,
    user_model: str | None = None,
) -> dict:
    return asyncio.get_event_loop().run_until_complete(
        _run_pipeline(
            self, application_id, job_text, resume_text, applicant_name,
            user_provider, user_model,
        )
    )


async def _run_pipeline(
    task,
    application_id: str,
    job_text: str,
    resume_text: str,
    applicant_name: str,
    user_provider: str | None,
    user_model: str | None,
) -> dict:
    kw = {"user_provider": user_provider, "user_model": user_model}

    resume = await ResumeParserAgent().parse(resume_text, **kw)
    job = await JobAnalyzerAgent().analyze(job_text, **kw)
    ats = await ATSKeywordAgent().analyze(resume, job, **kw)
    match = await MatchScorerAgent().score(resume, job, **kw)
    optimized = await ResumeOptimizerAgent().optimize(resume, job, ats, **kw)
    cover = await CoverLetterAgent().generate(resume, job, applicant_name, **kw)
    questions = await InterviewQuestionsAgent().generate(resume, job, match, **kw)
    gaps = await SkillGapAgent().analyze(resume, job, ats, **kw)

    return {
        "application_id": application_id,
        "match_score": match.overall_score,
        "strengths": match.strengths,
        "weaknesses": match.weaknesses,
        "skill_gaps": gaps.critical_gaps,
        "suggestions": gaps.suggestions,
        "optimized_resume": optimized.model_dump_json(),
        "cover_letter": cover.full_text,
        "interview_questions": json.dumps(
            questions.technical_questions + questions.behavioral_questions
        ),
    }
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/tasks/generate_application.py
git commit -m "feat: wire all 8 AI agents into generate_application Celery pipeline"
```

---

## Task 16: Health check endpoint for AI providers

**Files:**
- Create: `backend/app/api/v1/health.py`
- Modify: `backend/app/api/v1/router.py`

- [ ] **Step 1: Write health.py**

```python
# backend/app/api/v1/health.py
from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.models.user import User
from app.ai.registry import provider_registry

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/ai-providers")
async def ai_provider_health(current_user: User = Depends(get_current_user)):
    return await provider_registry.health_check_all()
```

- [ ] **Step 2: Add to router.py**

In `backend/app/api/v1/router.py`, add:
```python
from app.api.v1 import health
router.include_router(health.router)
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/api/v1/health.py backend/app/api/v1/router.py
git commit -m "feat: add AI provider health check endpoint"
```

---

## Phase 3 Complete

8 agents implemented, provider registry wired, Celery pipeline assembled.

Run all tests:
```bash
cd backend && python -m pytest tests/ -v
```
Expected: all PASS.

**Next:** Phase 4 — Document Processing (PDF/DOCX/OCR) + file upload endpoint.
