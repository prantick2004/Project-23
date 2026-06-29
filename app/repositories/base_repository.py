"""
Base Repository — generic async CRUD operations for all repositories.
"""
from typing import Generic, TypeVar, Type, Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.infrastructure.database.connection import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Generic base repository with async CRUD operations."""

    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db    = db

    async def get_by_id(self, id: str) -> Optional[ModelType]:
        """Get single record by ID."""
        result = await self.db.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """Get all records with pagination."""
        result = await self.db.execute(
            select(self.model).offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def create(self, obj: ModelType) -> ModelType:
        """Save new record to database."""
        self.db.add(obj)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def update(self, obj: ModelType) -> ModelType:
        """Update existing record."""
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def delete(self, obj: ModelType) -> None:
        """Delete record from database."""
        await self.db.delete(obj)
        await self.db.commit()

    async def count(self) -> int:
        """Count total records."""
        result = await self.db.execute(select(self.model))
        return len(result.scalars().all())
