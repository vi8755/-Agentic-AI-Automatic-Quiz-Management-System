"""add unique submission constraint to descriptive evaluation jobs

Revision ID: b0a0539f5490
Revises: 147572d9c62f
Create Date: 2026-09-29 18:46:23.655299

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b0a0539f5490'
down_revision: Union[str, Sequence[str], None] = '147572d9c62f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    """Upgrade schema."""
    op.create_unique_constraint(
        "uq_descriptive_evaluation_jobs_submission_id",
        "descriptive_evaluation_jobs",
        ["submission_id"],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(
        "uq_descriptive_evaluation_jobs_submission_id",
        "descriptive_evaluation_jobs",
        type_="unique",
    )