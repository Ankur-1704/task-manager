"""backfill is_verified after removing email OTP

Revision ID: f1a2b3c4d5e6
Revises: c4f2e9b1a7d3
Create Date: 2026-05-03

"""

from typing import Sequence, Union

from alembic import op

revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, None] = "c4f2e9b1a7d3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("UPDATE users SET is_verified = true WHERE is_verified = false")


def downgrade() -> None:
    pass
