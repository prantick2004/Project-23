"""
Batch A regression tests — auth token-type enforcement, token hygiene, and CORS.
Pure/unit level: no DB, Redis, or AI models required.
Run: ./venv/bin/python -m pytest tests/test_batch_a.py -q
"""
import asyncio
import types
import pytest
from fastapi import HTTPException
from starlette.testclient import TestClient
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.security import create_access_token, create_refresh_token, decode_token
from app.core.config import get_settings
import app.api.dependencies as deps


# ---- helpers ---------------------------------------------------------------
class _Creds:
    def __init__(self, token): self.credentials = token

class _Result:
    def __init__(self, user): self._user = user
    def scalar_one_or_none(self): return self._user

class _FakeDB:
    def __init__(self, user): self._user = user
    async def execute(self, *_a, **_k): return _Result(self._user)

_USER = types.SimpleNamespace(id="u1", role="admin", is_active=True)

def _call_get_current_user(token, user=_USER, blocked=False):
    async def _fake_blocked(_jti): return blocked
    deps.is_token_blocked = _fake_blocked  # monkeypatch module-level ref
    return asyncio.run(deps.get_current_user(credentials=_Creds(token), db=_FakeDB(user)))


# ---- token type enforcement (the MEDIUM finding) ---------------------------
def test_access_token_is_accepted():
    tok = create_access_token({"sub": "u1", "role": "admin"})
    user = _call_get_current_user(tok)
    assert user.id == "u1"

def test_refresh_token_rejected_as_access():
    tok = create_refresh_token({"sub": "u1", "role": "admin"})
    with pytest.raises(HTTPException) as e:
        _call_get_current_user(tok)
    assert e.value.status_code == 401

def test_malformed_token_rejected():
    with pytest.raises(HTTPException) as e:
        _call_get_current_user("not.a.jwt")
    assert e.value.status_code == 401

def test_revoked_access_token_rejected():
    tok = create_access_token({"sub": "u1", "role": "admin"})
    with pytest.raises(HTTPException) as e:
        _call_get_current_user(tok, blocked=True)
    assert e.value.status_code == 401

def test_unknown_user_rejected():
    tok = create_access_token({"sub": "ghost", "role": "admin"})
    with pytest.raises(HTTPException) as e:
        _call_get_current_user(tok, user=None)
    assert e.value.status_code == 401


# ---- token hygiene ---------------------------------------------------------
def test_tokens_carry_type_and_jti():
    a = decode_token(create_access_token({"sub": "u1"}))
    r = decode_token(create_refresh_token({"sub": "u1"}))
    assert a["type"] == "access" and r["type"] == "refresh"
    assert a["jti"] and r["jti"] and a["jti"] != r["jti"]
    assert "exp" in a and "exp" in r


# ---- CORS allow-list (the HIGH finding) ------------------------------------
def _cors_app():
    s = get_settings()
    app = FastAPI()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=s.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    @app.get("/ping")
    def ping(): return {"ok": True}
    return app, s

def test_cors_never_wildcard():
    _, s = _cors_app()
    assert "*" not in s.cors_origins_list

def test_cors_allows_configured_origin():
    app, s = _cors_app()
    origin = s.cors_origins_list[0]
    r = TestClient(app).options(
        "/ping",
        headers={"Origin": origin, "Access-Control-Request-Method": "GET"},
    )
    assert r.headers.get("access-control-allow-origin") == origin
    assert r.headers.get("access-control-allow-credentials") == "true"

def test_cors_rejects_unknown_origin():
    app, _ = _cors_app()
    r = TestClient(app).options(
        "/ping",
        headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "GET"},
    )
    assert r.headers.get("access-control-allow-origin") is None
