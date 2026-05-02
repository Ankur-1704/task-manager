"""remove google_id and auth_provider from users

Revision ID: c4f2e9b1a7d3
Revises: 8b0afa505058
Create Date: 2026-05-02

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c4f2e9b1a7d3"
down_revision: Union[str, None] = "8b0afa505058"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    for uc in insp.get_unique_constraints("users"):
        cols = uc.get("column_names") or []
        if "google_id" in cols and len(cols) == 1:
            op.drop_constraint(uc["name"], "users", type_="unique")
            break
    op.drop_column("users", "google_id")
    op.drop_column("users", "auth_provider")


def downgrade() -> None:
    op.add_column(
        "users",
        sa.Column("auth_provider", sa.String(length=20), nullable=False, server_default="email"),
    )
    op.add_column("users", sa.Column("google_id", sa.String(length=255), nullable=True))
    op.create_unique_constraint("users_google_id_key", "users", ["google_id"])
    op.alter_column("users", "auth_provider", server_default=None)
