"""create ai_provider_configs table

Revision ID: 005
Revises: 004
Create Date: 2026-05-19
"""

import sqlalchemy as sa
from alembic import op

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ai_provider_configs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("task_type", sa.String(100), nullable=False),
        sa.Column("provider", sa.String(50), nullable=False),
        sa.Column("model", sa.String(100), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("extra_params", sa.Text, nullable=True),
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
    op.create_index("ix_ai_provider_configs_user_id", "ai_provider_configs", ["user_id"])
    op.create_unique_constraint(
        "uq_ai_config_user_task", "ai_provider_configs", ["user_id", "task_type"]
    )
    op.execute("""
        CREATE OR REPLACE TRIGGER ai_provider_configs_set_updated_at
        BEFORE UPDATE ON ai_provider_configs
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS ai_provider_configs_set_updated_at ON ai_provider_configs;")
    op.drop_constraint("uq_ai_config_user_task", "ai_provider_configs", type_="unique")
    op.drop_index("ix_ai_provider_configs_user_id", "ai_provider_configs")
    op.drop_table("ai_provider_configs")
