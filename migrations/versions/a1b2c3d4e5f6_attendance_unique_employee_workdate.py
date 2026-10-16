"""attendance: enforce one record per employee per work_date

Additive, reversible. Guards against pre-existing duplicates so it fails
safely (no data change) instead of corrupting anything. The unique
constraint also creates a supporting index, which speeds the frequent
(employee_id, work_date) lookup.

Revision ID: a1b2c3d4e5f6
Revises: da7122b9e0e0
Create Date: 2026-10-16
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'da7122b9e0e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

CONSTRAINT = "uq_attendance_employee_workdate"


def upgrade() -> None:
    # Fail safely if real data already violates the rule — do NOT delete/merge.
    conn = op.get_bind()
    dupes = conn.execute(sa.text(
        "SELECT count(*) FROM ("
        "  SELECT employee_id, work_date FROM attendance_records"
        "  GROUP BY employee_id, work_date HAVING count(*) > 1"
        ") d"
    )).scalar()
    if dupes:
        raise RuntimeError(
            f"Refusing to add {CONSTRAINT}: {dupes} duplicate "
            "(employee_id, work_date) group(s) already exist. Resolve them "
            "manually before applying this migration."
        )
    op.create_unique_constraint(
        CONSTRAINT, "attendance_records", ["employee_id", "work_date"]
    )


def downgrade() -> None:
    op.drop_constraint(CONSTRAINT, "attendance_records", type_="unique")
