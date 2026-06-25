"""
Database connection and session management.
"""
from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession, AsyncEngine,
    async_sessionmaker, create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()

class Base(DeclarativeBase):
    pass

def create_engine() -> AsyncEngine:
    engine = create_async_engine(
        settings.database_url,
        echo=settings.debug,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=3600,
    )
    logger.info("Database engine created", url=settings.database_host)
    return engine

engine = create_engine()

AsyncSessionFactory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionFactory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
