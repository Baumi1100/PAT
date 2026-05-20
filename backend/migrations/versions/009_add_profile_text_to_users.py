"""add profile_text to users

Revision ID: 009
Revises: 008
Create Date: 2026-05-20
"""

import sqlalchemy as sa
from alembic import op

revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("profile_text", sa.Text, nullable=True))


def downgrade() -> None:
    op.drop_column("users", "profile_text")
