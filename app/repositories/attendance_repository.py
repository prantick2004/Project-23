"""
AttendanceRepository — DB ops for attendance_records.
One row per employee per work_date (upsert-style).
"""
from typing import Optional, List
from datetime import date
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.base_repository import BaseRepository
from app.infrastructure.database.models.attendance import AttendanceRecord


class AttendanceRepository(BaseRepository[AttendanceRecord]):
    def __init__(self, db: AsyncSession):
        super().__init__(AttendanceRecord, db)

    async def get_by_employee_and_date(
        self, employee_id: UUID, work_date: date
    ) -> Optional[AttendanceRecord]:
        """Fetch today's (or any date's) single record for an employee."""
        result = await self.db.execute(
            select(AttendanceRecord).where(
                AttendanceRecord.employee_id == employee_id,
                AttendanceRecord.work_date == work_date,
            )
        )
        return result.scalar_one_or_none()

    async def list_by_date(
        self, work_date: date, skip: int = 0, limit: int = 100
    ) -> List[AttendanceRecord]:
        result = await self.db.execute(
            select(AttendanceRecord)
            .where(AttendanceRecord.work_date == work_date)
            .offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def list_by_employee(
        self, employee_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[AttendanceRecord]:
        result = await self.db.execute(
            select(AttendanceRecord)
            .where(AttendanceRecord.employee_id == employee_id)
            .order_by(AttendanceRecord.work_date.desc())
            .offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def list_all(self, skip: int = 0, limit: int = 100) -> List[AttendanceRecord]:
        result = await self.db.execute(
            select(AttendanceRecord)
            .order_by(AttendanceRecord.work_date.desc())
            .offset(skip).limit(limit)
        )
        return result.scalars().all()
