# backend/app/models/user.py
import sqlalchemy as sa
from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import AuditMixin, Base, generate_uuid


class User(Base, AuditMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default=sa.text("true"), nullable=False
    )
    is_superuser: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=sa.text("false"), nullable=False
    )
    telegram_chat_id: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True)
    resumes: Mapped[list["Resume"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Resume", back_populates="user", lazy="select"
    )
