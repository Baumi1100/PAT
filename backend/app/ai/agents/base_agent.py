# backend/app/ai/agents/base_agent.py
import json
from typing import TypeVar

import structlog
from pydantic import BaseModel, ValidationError

from app.ai.base import CompletionMessage, CompletionRequest
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
        provider, model = self._registry.get_for_task(self.task_type, user_provider, user_model)
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
