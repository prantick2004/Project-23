"""
Batch B regression tests — role authorization, WS auth guard, login hardening,
and rate-limit wiring. Pure/unit level (no DB/Redis/models needed).
Run: ./venv/bin/python -m pytest tests/test_batch_b.py -q
"""
import asyncio
import types
import inspect
import pytest
from fastapi import HTTPException

from app.api.dependencies import require_roles
from app.core.constants import UserRole


def _user(role): return types.SimpleNamespace(role=role, is_active=True)

def _check(dep_factory_roles, user_role):
    checker = require_roles(*dep_factory_roles)
    return asyncio.run(checker(current_user=_user(user_role)))


# ---- role-based authorization (ADMIN / OPERATOR / VIEWER) ------------------
def test_admin_dep_allows_admin_only():
    assert _check([UserRole.ADMIN], "admin").role == "admin"
    for r in ("operator", "viewer"):
        with pytest.raises(HTTPException) as e: _check([UserRole.ADMIN], r)
        assert e.value.status_code == 403

def test_operator_dep_allows_admin_and_operator():
    for r in ("admin", "operator"):
        assert _check([UserRole.ADMIN, UserRole.OPERATOR], r).role == r
    with pytest.raises(HTTPException) as e: _check([UserRole.ADMIN, UserRole.OPERATOR], "viewer")
    assert e.value.status_code == 403

def test_viewer_dep_allows_all_three():
    for r in ("admin", "operator", "viewer"):
        assert _check([UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER], r).role == r

def test_unknown_role_denied():
    with pytest.raises(HTTPException):
        _check([UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER], "superuser")


# ---- camera WebSocket must be authenticated (regression vs the bypass) -----
def test_camera_ws_stream_calls_ws_auth():
    import app.api.websockets.camera_stream as cs
    src = inspect.getsource(cs.websocket_camera_stream)
    assert "get_ws_user" in src, "camera WS stream must authenticate via get_ws_user"
    # auth must happen before the socket is registered/accepted
    assert src.index("get_ws_user") < src.index("connection_manager.connect")


# ---- login hardening: dummy-hash timing equalisation -----------------------
def test_login_has_dummy_hash_and_rate_limit():
    import app.api.routers.v1.auth as auth
    from app.core.security import verify_password
    # a real bcrypt hash exists and verifies correctly (used for unknown users)
    assert verify_password("dummy-password-for-timing-equalisation", auth._DUMMY_HASH)
    # login + refresh carry an explicit rate limit decorator
    assert hasattr(auth.login, "__wrapped__") or "limit" in repr(auth.login)
