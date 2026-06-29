"""
Department Repository — async database operations for Department model.
"""
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base_repository import BaseRepository
from app.infrastructure.database.models.department import Department


class DepartmentRepository(BaseRepository[Department]):
    """Handles all Department database operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(Department, db)

    async def get_by_name(self, name: str) -> Optional[Department]:
        """Get department by unique name."""
        result = await self.db.execute(
            select(Department).where(Department.name == name)
        )
        return result.scalar_one_or_none()

    async def get_active_departments(self) -> List[Department]:
        """Get all active departments."""
        result = await self.db.execute(
            select(Department).where(Department.is_active == True)
        )
        return result.scalars().all()

    async def deactivate(self, department_id: str) -> Optional[Department]:
        """Soft delete — set is_active to False."""
        department = await self.get_by_id(department_id)
        if department:
            department.is_active = False
            return await self.update(department)
        return None
