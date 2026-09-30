"""add descriptive evaluation jobs

Revision ID: 147572d9c62f
Revises: c97ca0a46d38
Create Date: 2026-09-29 14:46:05.874665

"""
from typing import Sequence, Union

 

# revision identifiers, used by Alembic.
revision: str = '147572d9c62f'
down_revision: Union[str, Sequence[str], None] = 'c97ca0a46d38'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


from alembic import op
import sqlalchemy as sa


def upgrade():

    op.create_table(
        "descriptive_evaluation_jobs",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),

        sa.Column(
            "submission_id",
            sa.Integer(),
            sa.ForeignKey(
                "descriptive_submissions.id"
            ),
            nullable=False,
        ),

        sa.Column(
            "job_type",
            sa.String(),
            nullable=False,
            server_default="MANUAL",
        ),

        sa.Column(
            "status",
            sa.String(),
            nullable=False,
            server_default="PENDING",
        ),

        sa.Column(
            "attempts",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),

        sa.Column(
            "max_attempts",
            sa.Integer(),
            nullable=False,
            server_default="3",
        ),

        sa.Column(
            "locked_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),

        sa.Column(
            "last_error",
            sa.String(),
            nullable=True,
        ),

        sa.Column(
    "created_at",
    sa.DateTime(),
    nullable=False,
    server_default=sa.func.now(),
),

        sa.Column(
            "completed_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_descriptive_evaluation_jobs_status",
        "descriptive_evaluation_jobs",
        ["status"],
    )

    op.create_index(
        "ix_descriptive_evaluation_jobs_submission_id",
        "descriptive_evaluation_jobs",
        ["submission_id"],
    )


def downgrade():

    op.drop_index(
        "ix_descriptive_evaluation_jobs_submission_id",
        table_name="descriptive_evaluation_jobs",
    )

    op.drop_index(
        "ix_descriptive_evaluation_jobs_status",
        table_name="descriptive_evaluation_jobs",
    )

    op.drop_table(
        "descriptive_evaluation_jobs"
    )