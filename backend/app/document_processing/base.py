# backend/app/document_processing/base.py
from dataclasses import dataclass, field


@dataclass
class DocumentResult:
    text: str
    page_count: int = 1
    word_count: int = 0
    extraction_method: str = "unknown"
    warnings: list[str] = field(default_factory=list)

    def __post_init__(self) -> None:
        self.word_count = len(self.text.split())
