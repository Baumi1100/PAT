# backend/tests/unit/ai/test_openai_provider.py
from unittest.mock import AsyncMock, MagicMock, patch

from app.ai.base import CompletionMessage, CompletionRequest
from app.ai.providers.openai_provider import OpenAIProvider


def test_list_models():
    provider = OpenAIProvider(api_key="test-key")
    models = provider.list_models()
    assert "gpt-4o" in models
    assert "gpt-4.1" in models


async def test_complete_returns_response():
    provider = OpenAIProvider(api_key="test-key")
    mock_response = MagicMock()
    mock_response.choices[0].message.content = '{"result": "ok"}'
    mock_response.model = "gpt-4o"
    mock_response.usage.prompt_tokens = 10
    mock_response.usage.completion_tokens = 5

    with patch.object(
        provider._client.chat.completions, "create", new=AsyncMock(return_value=mock_response)
    ):
        req = CompletionRequest(
            messages=[CompletionMessage(role="user", content="hello")],
            model="gpt-4o",
        )
        resp = await provider.complete(req)
        assert resp.content == '{"result": "ok"}'
        assert resp.provider == "openai"
