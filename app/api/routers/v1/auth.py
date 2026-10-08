"""
app/api/routers/v1/auth.py
--------------------------
Authentication routes for Project-23.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.infrastructure.database.connection import get_db
from app.infrastructure.database.models.user import UserModel
from app.core.security import (
    verify_password, hash_password, create_access_token,
    create_refresh_token, decode_token
)
from app.core.config import get_settings
from app.core.rate_limit import limiter
from app.api.schemas.auth import (
    LoginRequest, TokenResponse,
    RefreshRequest, UserResponse, LogoutRequest
)
from app.api.dependencies import get_current_active_user
from app.core.token_blocklist import block_token, is_token_blocked
from datetime import datetime, timezone

router   = APIRouter(prefix="/auth", tags=["Authentication"])
settings = get_settings()

# Pre-computed dummy hash so a failed login runs bcrypt even when the username
# doesn't exist — equalises response time and prevents username enumeration.
_DUMMY_HASH = hash_password("dummy-password-for-timing-equalisation")


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login with username and password — returns JWT tokens."""
    result = await db.execute(
        select(UserModel).where(UserModel.username == payload.username)
    )
    user = result.scalar_one_or_none()

    # Always run a password verification (dummy when the user is absent) so the
    # timing of a wrong-username vs wrong-password response is indistinguishable.
    if user is None:
        verify_password(payload.password, _DUMMY_HASH)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )

    token_data    = {"sub": str(user.id), "role": user.role}
    access_token  = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.access_token_expire_minutes * 60
    )


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("20/minute")
async def refresh(request: Request, body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Exchange refresh token for new access token."""
    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise ValueError("Not a refresh token")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    if await is_token_blocked(payload.get("jti", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked"
        )

    # A malformed/missing "sub" is a bad token (401). A genuine database
    # failure must NOT be masked as "invalid token" — let it surface as a 500
    # so a valid user is never wrongly rejected during an outage.
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
    result = await db.execute(select(UserModel).where(UserModel.id == sub))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or disabled"
        )

    token_data = {"sub": str(user.id), "role": user.role}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        expires_in=settings.access_token_expire_minutes * 60
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user=Depends(get_current_active_user)):
    """Get current logged in user info."""
    return current_user


@router.post("/logout")
async def logout(request: LogoutRequest):
    """
    Invalidate the refresh token immediately, before its natural expiry.
    If the caller also includes the current access token, that is
    revoked too -- otherwise the access token stays valid until its own
    (short, ~30 min) natural expiry even after logout, which is a real
    gap for anyone who wants a logout to take effect immediately.
    Client should discard both tokens locally regardless.
    """
    async def _revoke(token: str) -> None:
        if not token:
            return
        try:
            payload = decode_token(token)
        except ValueError:
            return  # already invalid/expired -- nothing to revoke
        jti = payload.get("jti", "")
        exp = payload.get("exp")
        if jti and exp:
            remaining_seconds = int(exp - datetime.now(timezone.utc).timestamp())
            await block_token(jti, remaining_seconds)

    await _revoke(request.refresh_token)
    await _revoke(request.access_token)

    return {"message": "Logged out"}
