"""
Batch D regression tests — attendance concurrency (Fix A).
Deterministic, DB-free: the IntegrityError upsert path is exercised with mocks.
Real-PostgreSQL constraint/concurrency behaviour is verified separately against
an isolated test database (see batch report).
Run: ./venv/bin/python -m pytest tests/test_batch_d.py -q
"""
import asyncio
import types
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.exc import IntegrityError

import app.infrastructure.database.base  # register ALL models (Employee<->Department etc.)
from app.services.attendance_service import AttendanceService
from app.infrastructure.database.models.attendance import AttendanceRecord


def _employee():
    return types.SimpleNamespace(id=uuid.uuid4(), shift_start_time=None)

def _integrity_error():
    return IntegrityError("INSERT ...", {}, Exception("duplicate key value violates unique constraint"))

def _service_with_mocks(get_side_effect, commit_side_effect=None):
    db = MagicMock()
    db.add = MagicMock()
    db.commit = AsyncMock(side_effect=commit_side_effect)
    db.rollback = AsyncMock()
    db.refresh = AsyncMock()
    svc = AttendanceService.__new__(AttendanceService)  # skip real __init__ (no engine)
    svc.db = db
    svc.repo = MagicMock()
    svc.repo.get_by_employee_and_date = AsyncMock(side_effect=get_side_effect)
    return svc, db


# ---- Fix A: concurrent-insert conflict is handled, not raised --------------
def test_checkin_integrity_conflict_refetches_existing():
    existing = AttendanceRecord(employee_id=uuid.uuid4(), work_date=datetime.now(timezone.utc).date(),
                                check_in_time=datetime.now(timezone.utc), status="present")
    # 1st get -> None (insert branch); commit -> IntegrityError; 2nd get -> winner's row
    svc, db = _service_with_mocks(get_side_effect=[None, existing], commit_side_effect=_integrity_error())
    result = asyncio.run(svc.record_checkin(_employee(), None, datetime.now(timezone.utc), 0.9))
    assert result is existing          # returns the winner's record, no duplicate
    db.rollback.assert_awaited()       # failed tx was rolled back before re-fetch
    # did NOT raise

def test_checkin_integrity_conflict_reraises_if_still_missing():
    # commit fails but re-fetch finds nothing -> genuinely unexpected -> re-raise
    svc, _ = _service_with_mocks(get_side_effect=[None, None], commit_side_effect=_integrity_error())
    with pytest.raises(IntegrityError):
        asyncio.run(svc.record_checkin(_employee(), None, datetime.now(timezone.utc), 0.9))

def test_checkin_happy_path_commits_once():
    svc, db = _service_with_mocks(get_side_effect=[None], commit_side_effect=None)
    asyncio.run(svc.record_checkin(_employee(), None, datetime.now(timezone.utc), 0.9))
    db.commit.assert_awaited()
    db.rollback.assert_not_awaited()


# ---- model + migration enforce the rule ------------------------------------
def test_attendance_model_declares_unique_constraint():
    from sqlalchemy import UniqueConstraint
    ucs = [c for c in AttendanceRecord.__table__.constraints if isinstance(c, UniqueConstraint)]
    cols = {tuple(sorted(c.name for c in uc.columns)) for uc in ucs}
    assert ("employee_id", "work_date") in cols

def test_migration_guards_against_existing_duplicates():
    import importlib.util, glob
    path = glob.glob("migrations/versions/*attendance_unique*")[0]
    src = open(path).read()
    assert "HAVING count(*) > 1" in src and "create_unique_constraint" in src
    assert "def downgrade" in src and "drop_constraint" in src  # reversible
