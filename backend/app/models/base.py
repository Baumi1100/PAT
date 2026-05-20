import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class AuditMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        # onupdate fires only for ORM-layer writes; raw SQL UPDATE bypasses this.
        # A DB-level trigger (set_updated_at) is added in the initial migration.
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )


def generate_uuid() -> str:
    return str(uuid.uuid4())
