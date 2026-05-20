# backend/migrations/versions/004_create_applications.py
"""create applications table

Revision ID: 004
Revises: 003
Create Date: 2026-05-19
"""

import sqlalchemy as sa
from alembic import op

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "applications",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("job_id", sa.String(36), sa.ForeignKey("jobs.id"), nullable=False),
        sa.Column("resume_id", sa.String(36), sa.ForeignKey("resumes.id"), nullable=False),
        sa.Column("match_score", sa.Float, nullable=True),
        sa.Column("strengths", sa.Text, nullable=True),
        sa.Column("weaknesses", sa.Text, nullable=True),
        sa.Column("skill_gaps", sa.Text, nullable=True),
        sa.Column("suggestions", sa.Text, nullable=True),
        sa.Column("optimized_resume", sa.Text, nullable=True),
        sa.Column("cover_letter", sa.Text, nullable=True),
        sa.Column("interview_questions", sa.Text, nullable=True),
        sa.Column(
            "status",
            sa.String(50),
            nullable=False,
            server_default=sa.text("'pending'"),
        ),
        sa.Column("celery_task_id", sa.String(255), nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
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
    op.create_index("ix_applications_user_id", "applications", ["user_id"])
    op.create_index("ix_applications_job_id", "applications", ["job_id"])
    op.create_index("ix_applications_status", "applications", ["status"])
    op.execute("""
        CREATE OR REPLACE TRIGGER applications_set_updated_at
        BEFORE UPDATE ON applications
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS applications_set_updated_at ON applications;")
    op.drop_index("ix_applications_status", "applications")
    op.drop_index("ix_applications_job_id", "applications")
    op.drop_index("ix_applications_user_id", "applications")
    op.drop_table("applications")
