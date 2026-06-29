"""
FastAPI shared dependencies — injected into route handlers.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError, jwt

from app.infrastructure.database.connection import AsyncSessionFactory
from app.core.config import get_settings

bearer_scheme = HTTPBearer()
settings      = get_settings()


async def get_db() -> AsyncSession:
    """Yield async database session."""
    async with AsyncSessionFactory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Decode JWT token and return current user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, settings.secret_key, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    from sqlalchemy import select
    from app.infrastructure.database.models.user import UserModel
    result = await db.execute(select(UserModel).where(UserModel.id == user_id))
    user   = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(current_user=Depends(get_current_user)):
    """Check user is active."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user
