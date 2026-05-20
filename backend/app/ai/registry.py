# backend/app/ai/registry.py
from app.ai.base import AIProvider
from app.ai.providers.anthropic_provider import AnthropicProvider
from app.ai.providers.ollama_provider import OllamaProvider
from app.ai.providers.openai_provider import OpenAIProvider
from app.config import get_settings

TASK_DEFAULTS: dict[str, tuple[str, str]] = {
    "resume_parsing":      ("openai", "gpt-4.1"),
    "job_analysis":        ("openai", "gpt-4.1"),
    "ats_keywords":        ("openai", "gpt-4.1"),
    "match_scoring":       ("openai", "gpt-4.1"),
    "resume_optimization": ("openai", "gpt-4.1"),
    "cover_letter":        ("anthropic", "claude-sonnet-4-6"),
    "interview_questions": ("anthropic", "claude-sonnet-4-6"),
    "skill_gap":           ("openai", "gpt-4.1"),
}


class ProviderRegistry:
    def __init__(self) -> None:
        self._providers: dict[str, AIProvider] = {}
        self._initialized = False

    def _build_providers(self) -> None:
        settings = get_settings()
        if settings.openai_api_key:
            self._providers["openai"] = OpenAIProvider(api_key=settings.openai_api_key)
        if settings.anthropic_api_key:
            self._providers["anthropic"] = AnthropicProvider(
                api_key=settings.anthropic_api_key
            )
        self._providers["ollama"] = OllamaProvider(base_url=settings.ollama_base_url)
        self._initialized = True

    def get(self, provider_name: str) -> AIProvider:
        if not self._initialized:
            self._build_providers()
        provider = self._providers.get(provider_name)
        if not provider:
            raise ValueError(
                f"Provider '{provider_name}' not configured. Check API keys in .env."
            )
        return provider

    def get_for_task(
        self,
        task_type: str,
        user_provider: str | None = None,
        user_model: str | None = None,
    ) -> tuple[AIProvider, str]:
        if not self._initialized:
            self._build_providers()
        if bool(user_provider) != bool(user_model):
            raise ValueError("Both user_provider and user_model must be supplied together.")
        if user_provider and user_model:
            return self.get(user_provider), user_model
        default_provider_name, default_model = TASK_DEFAULTS.get(
            task_type, ("openai", "gpt-4.1")
        )
        return self.get(default_provider_name), default_model

    async def health_check_all(self) -> dict[str, bool]:
        if not self._initialized:
            self._build_providers()
        results = {}
        for name, provider in self._providers.items():
            results[name] = await provider.health_check()
        return results


provider_registry = ProviderRegistry()
