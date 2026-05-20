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
            async with httpx.AsyncClient(timeout=600) as client, client.stream(
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
