"""add duration to descriptive assignments

Revision ID: eab880dfbd2b
Revises: 3cb07c28a44a
Create Date: 2026-08-20 17:25:06.842173

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "eab880dfbd2b"
down_revision: Union[str, Sequence[str], None] = "3cb07c28a44a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.add_column(
        "descriptive_assignments",
        sa.Column(
            "duration_minutes",
            sa.Integer(),
            nullable=True,
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_column(
        "descriptive_assignments",
        "duration_minutes",
    )