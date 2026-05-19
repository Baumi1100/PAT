# backend/migrations/versions/003_create_jobs.py
"""create jobs table

Revision ID: 003
Revises: 002
Create Date: 2026-05-19
"""
import sqlalchemy as sa
from alembic import op

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "jobs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("company", sa.String(255), nullable=True),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("url", sa.String(2000), nullable=True),
        sa.Column("raw_text", sa.Text, nullable=True),
        sa.Column(
            "source", sa.String(50), nullable=False, server_default=sa.text("'manual'")
        ),
        sa.Column("parsed_data", sa.Text, nullable=True),
        sa.Column(
            "status", sa.String(50), nullable=False, server_default=sa.text("'new'")
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_jobs_user_id", "jobs", ["user_id"])
    op.create_index("ix_jobs_status", "jobs", ["status"])
    op.execute("""
        CREATE OR REPLACE TRIGGER jobs_set_updated_at
        BEFORE UPDATE ON jobs
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS jobs_set_updated_at ON jobs;")
    op.drop_index("ix_jobs_status", "jobs")
    op.drop_index("ix_jobs_user_id", "jobs")
    op.drop_table("jobs")
