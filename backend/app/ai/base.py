from typing import Protocol, runtime_checkable

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
