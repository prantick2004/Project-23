"""
Batch C regression tests — input validation, path-traversal neutralisation,
mass-assignment prevention, pagination bounds, and response serialisation.
Pure/unit level (no DB/Redis/models needed).
Run: ./venv/bin/python -m pytest tests/test_batch_c.py -q
"""
import inspect
from pathlib import Path
import pytest
from pydantic import ValidationError

from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse
from app.api.schemas.auth import UserResponse


# ---- employee_code validator (path-traversal at the filename source) -------
@pytest.mark.parametrize("bad", ["../../etc/passwd", "a/b", "x..y", "a b", "'; DROP", "a", "x"*21, "日本"])
def test_employee_code_rejects_unsafe(bad):
    with pytest.raises(ValidationError):
        EmployeeCreate(employee_code=bad, full_name="x")

@pytest.mark.parametrize("ok", ["EMP-001", "ZZTEST01", "a_b-9", "AB"])
def test_employee_code_accepts_safe(ok):
    assert EmployeeCreate(employee_code=ok, full_name="x").employee_code == ok.strip().upper()


# ---- mass assignment: update schema exposes no privileged fields -----------
def test_employee_update_has_no_privileged_fields():
    fields = set(EmployeeUpdate.model_fields)
    assert not (fields & {"role", "is_active", "is_admin", "hashed_password", "id", "created_by", "owner_id"})


# ---- report download: Path.name neutralises traversal ----------------------
@pytest.mark.parametrize("name", ["../../etc/passwd", "..\\..\\win.ini", "/etc/passwd", "a/../../b"])
def test_report_download_stays_in_dir(name):
    from app.api.routers.v1.reports import REPORTS_DIR
    resolved = (REPORTS_DIR / Path(name).name).resolve()
    assert resolved.is_relative_to(REPORTS_DIR.resolve()), f"{name} escaped {REPORTS_DIR}"


# ---- response serialisation: no secrets leaked -----------------------------
def test_user_response_excludes_secrets():
    f = set(UserResponse.model_fields)
    assert not (f & {"hashed_password", "password", "secret_key", "token"})

def test_employee_response_excludes_secrets():
    f = set(EmployeeResponse.model_fields)
    assert not (f & {"hashed_password", "password", "secret_key"})


# ---- pagination upper bounds declared on list endpoints --------------------
@pytest.mark.parametrize("module,func", [
    ("employees", "list_employees"), ("cameras", "list_cameras"),
    ("attendance", "list_attendance"), ("activities", "list_activities"),
    ("alerts", "list_alerts"), ("evidence", "list_evidence"),
])
def test_list_endpoints_have_upper_bound(module, func):
    mod = __import__(f"app.api.routers.v1.{module}", fromlist=[func])
    src = inspect.getsource(getattr(mod, func))
    assert "le=" in src, f"{module}.{func} limit must declare an le= upper bound"
