# backend/app/ai/providers/anthropic_provider.py
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
        system_content = ""
        messages = []
        for msg in request.messages:
            if msg.role == "system":
                system_content = msg.content
            else:
                messages.append({"role": msg.role, "content": msg.content})

        if not messages:
            messages = [{"role": "user", "content": "Continue."}]

        if request.response_format == "json_object" and system_content:
            system_content += "\n\nRespond with valid JSON only. No markdown, no explanation."
        elif request.response_format == "json_object":
            system_content = "Respond with valid JSON only. No markdown, no explanation."

        kwargs: dict = {
            "model": request.model,
            "max_tokens": request.max_tokens,
            "messages": messages,
            "temperature": request.temperature,
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
