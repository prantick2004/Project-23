"""
Employee Service — async business logic for employee management.
"""
import uuid
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import UploadFile

from app.repositories.employee_repository import EmployeeRepository
from app.repositories.department_repository import DepartmentRepository
from app.infrastructure.storage.local_storage import LocalStorageService
from app.infrastructure.database.models.employee import Employee


class EmployeeService:
    """Handles all employee business logic."""

    def __init__(self, db: AsyncSession):
        self.db              = db
        self.employee_repo   = EmployeeRepository(db)
        self.department_repo = DepartmentRepository(db)
        self.storage         = LocalStorageService()

    async def create_employee(self, data: dict) -> Employee:
        """Create new employee after validation."""
        if await self.employee_repo.get_by_employee_code(data["employee_code"]):
            raise ValueError(f"Employee code '{data['employee_code']}' already exists")
        if data.get("email") and await self.employee_repo.get_by_email(data["email"]):
            raise ValueError(f"Email '{data['email']}' already registered")
        if data.get("department_id"):
            dept = await self.department_repo.get_by_id(data["department_id"])
            if not dept:
                raise ValueError("Department not found")
        employee = Employee(
            id               = uuid.uuid4(),
            employee_code    = data["employee_code"],
            full_name        = data["full_name"],
            position         = data.get("position"),
            email            = data.get("email"),
            phone            = data.get("phone"),
            department_id    = data.get("department_id"),
            shift_start_time = data.get("shift_start_time"),
            shift_end_time   = data.get("shift_end_time"),
            status           = data.get("status", "active"),
            face_encoded     = False,
        )
        return await self.employee_repo.create(employee)

    async def get_employee(self, employee_id: str) -> Optional[Employee]:
        """Get employee by ID — raise if not found."""
        employee = await self.employee_repo.get_by_id(employee_id)
        if not employee:
            raise ValueError("Employee not found")
        return employee

    async def get_all_employees(self, skip: int = 0, limit: int = 100) -> List[Employee]:
        """Get paginated list of all employees."""
        return await self.employee_repo.get_all(skip=skip, limit=limit)

    async def get_active_employees(self) -> List[Employee]:
        """Get all active employees."""
        return await self.employee_repo.get_active_employees()

    async def search_employees(self, name: str) -> List[Employee]:
        """Search employees by name."""
        return await self.employee_repo.search_by_name(name)

    async def update_employee(self, employee_id: str, data: dict) -> Employee:
        """Update employee fields."""
        employee = await self.get_employee(employee_id)
        if data.get("email") and data["email"] != employee.email:
            if await self.employee_repo.get_by_email(data["email"]):
                raise ValueError("Email already used by another employee")
        allowed = [
            "full_name", "position", "email", "phone",
            "department_id", "shift_start_time", "shift_end_time", "status"
        ]
        for field in allowed:
            if field in data:
                setattr(employee, field, data[field])
        return await self.employee_repo.update(employee)

    async def delete_employee(self, employee_id: str) -> None:
        """Delete employee and their photo."""
        employee = await self.get_employee(employee_id)
        if employee.photo_path:
            self.storage.delete_file(employee.photo_path)
        await self.employee_repo.delete(employee)

    async def upload_photo(self, employee_id: str, file: UploadFile) -> Employee:
        """Upload and link employee photo."""
        employee = await self.get_employee(employee_id)
        if employee.photo_path:
            self.storage.delete_file(employee.photo_path)
        photo_path = await self.storage.save_employee_photo(file, employee.employee_code)
        return await self.employee_repo.update_photo_path(employee_id, photo_path)
