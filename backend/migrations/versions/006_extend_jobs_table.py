"""extend jobs table with tracking fields

Revision ID: 006
Revises: 005
Create Date: 2026-05-20
"""

import sqlalchemy as sa
from alembic import op

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("jobs", sa.Column("salary_range", sa.String(255), nullable=True))
    op.add_column("jobs", sa.Column("remote_policy", sa.String(100), nullable=True))
    op.add_column("jobs", sa.Column("employment_type", sa.String(100), nullable=True))
    op.add_column("jobs", sa.Column("seniority_level", sa.String(100), nullable=True))
    op.add_column("jobs", sa.Column("source_platform", sa.String(100), nullable=True))
    op.add_column("jobs", sa.Column("priority", sa.String(50), nullable=True))
    op.add_column("jobs", sa.Column("notes", sa.Text, nullable=True))
    op.add_column("jobs", sa.Column("contact_person", sa.String(255), nullable=True))
    op.add_column("jobs", sa.Column("applied_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    for col in [
        "applied_at",
        "contact_person",
        "notes",
        "priority",
        "source_platform",
        "seniority_level",
        "employment_type",
        "remote_policy",
        "salary_range",
    ]:
        op.drop_column("jobs", col)
