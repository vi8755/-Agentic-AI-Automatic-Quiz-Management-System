"""add batches and link sections

Revision ID: bf3c10d388af
Revises: eab880dfbd2b
Create Date: 2026-08-22 10:32:18.100902

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bf3c10d388af'
down_revision: Union[str, Sequence[str], None] = 'eab880dfbd2b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None



def upgrade() -> None:

    # ============================================================
    # 1. CREATE BATCHES TABLE
    # ============================================================

    op.create_table(
        "batches",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),

        sa.Column(
            "batch_name",
            sa.String(),
            nullable=False,
        ),

        sa.Column(
            "department",
            sa.String(),
            nullable=False,
        ),

        sa.Column(
            "start_year",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "end_year",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=True,
            server_default=sa.true(),
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=True,
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=True,
        ),
    )

    # ============================================================
    # 2. ADD batch_id TO EXISTING sections TABLE
    #
    # Temporarily nullable because existing sections already exist.
    # ============================================================

    op.add_column(
        "sections",
        sa.Column(
            "batch_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    # ============================================================
    # 3. CREATE FOREIGN KEY
    # ============================================================

    op.create_foreign_key(
        "fk_sections_batch_id",
        "sections",
        "batches",
        ["batch_id"],
        ["id"],
    )

    # ============================================================
    # 4. CREATE EXISTING BATCH
    #
    # Your current sections are CSE and belong to 2023-27.
    # ============================================================

    op.execute(
        """
        INSERT INTO batches
        (
            batch_name,
            department,
            start_year,
            end_year,
            is_active
        )
        VALUES
        (
            '2023-27',
            'CSE',
            2023,
            2027,
            TRUE
        )
        """
    )

    # ============================================================
    # 5. ASSIGN EXISTING CSE SECTIONS TO THE NEW BATCH
    # ============================================================

    op.execute(
        """
        UPDATE sections
        SET batch_id = (
            SELECT id
            FROM batches
            WHERE batch_name = '2023-27'
              AND department = 'CSE'
            LIMIT 1
        )
        WHERE department = 'CSE'
        """
    )

    # ============================================================
    # 6. MAKE batch_id REQUIRED
    # ============================================================

    op.alter_column(
        "sections",
        "batch_id",
        existing_type=sa.Integer(),
        nullable=False,
    )


def downgrade() -> None:

    # Remove foreign key
    op.drop_constraint(
        "fk_sections_batch_id",
        "sections",
        type_="foreignkey",
    )

    # Remove batch_id
    op.drop_column(
        "sections",
        "batch_id",
    )

    # Remove batches table
    op.drop_table("batches")