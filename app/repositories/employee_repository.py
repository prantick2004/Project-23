"""
Employee Repository — async database operations for Employee model.
"""
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base_repository import BaseRepository
from app.infrastructure.database.models.employee import Employee


class EmployeeRepository(BaseRepository[Employee]):
    """Handles all Employee database operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(Employee, db)

    async def get_by_employee_code(self, employee_code: str) -> Optional[Employee]:
        """Get employee by unique employee code."""
        result = await self.db.execute(
            select(Employee).where(Employee.employee_code == employee_code)
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[Employee]:
        """Get employee by email address."""
        result = await self.db.execute(
            select(Employee).where(Employee.email == email)
        )
        return result.scalar_one_or_none()

    async def get_by_department(self, department_id: str) -> List[Employee]:
        """Get all employees in a department."""
        result = await self.db.execute(
            select(Employee).where(Employee.department_id == department_id)
        )
        return result.scalars().all()

    async def get_active_employees(self) -> List[Employee]:
        """Get all active employees."""
        result = await self.db.execute(
            select(Employee).where(Employee.status == "active")
        )
        return result.scalars().all()

    async def get_face_encoded_employees(self) -> List[Employee]:
        """Get employees with face encodings registered."""
        result = await self.db.execute(
            select(Employee).where(Employee.face_encoded == True)
        )
        return result.scalars().all()

    async def search_by_name(self, name: str) -> List[Employee]:
        """Search employees by full name."""
        result = await self.db.execute(
            select(Employee).where(Employee.full_name.ilike(f"%{name}%"))
        )
        return result.scalars().all()

    async def update_face_encoded_status(self, employee_id: str, status: bool) -> Optional[Employee]:
        """Update face_encoded flag after encoding registered."""
        employee = await self.get_by_id(employee_id)
        if employee:
            employee.face_encoded = status
            return await self.update(employee)
        return None

    async def update_photo_path(self, employee_id: str, photo_path: str) -> Optional[Employee]:
        """Update employee photo path after upload."""
        employee = await self.get_by_id(employee_id)
        if employee:
            employee.photo_path = photo_path
            return await self.update(employee)
        return None
