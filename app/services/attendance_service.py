"""
AttendanceService — business logic for automatic check-in/check-out.
Called from stream_manager's recognition loop (Phase 6 hook) and from
the read-only/override API routes.
"""
from datetime import datetime, date, timezone, timedelta
from typing import Optional, List
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.attendance_repository import AttendanceRepository
from app.infrastructure.database.models.attendance import AttendanceRecord
from app.infrastructure.database.models.employee import Employee
from app.core.constants import AttendanceStatus, AppConstants


class AttendanceService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = AttendanceRepository(db)

    # ------------------------------------------------------------------
    # CHECK-IN
    # ------------------------------------------------------------------
    async def record_checkin(
        self,
        employee: Employee,
        camera_id: UUID,
        timestamp: datetime,
        confidence: float,
    ) -> Optional[AttendanceRecord]:
        """
        Create or reuse today's record, set check_in_time + status.
        Returns None if suppressed by cooldown (no-op).
        """
        work_date = timestamp.date()
        record = await self.repo.get_by_employee_and_date(employee.id, work_date)

        if record and record.check_in_time is not None:
            # Cooldown: already checked in — skip if within window
            elapsed = timestamp - record.check_in_time
            if elapsed < timedelta(minutes=AppConstants.ATTENDANCE_COOLDOWN_MINUTES):
                return None
            return record  # already checked in, outside cooldown -> no change

        status_value = self._compute_checkin_status(employee, timestamp)

        if record is None:
            record = AttendanceRecord(
                employee_id=employee.id,
                work_date=work_date,
                check_in_time=timestamp,
                check_in_camera_id=camera_id,
                check_in_confidence=confidence,
                status=status_value,
            )
            self.db.add(record)
        else:
            record.check_in_time = timestamp
            record.check_in_camera_id = camera_id
            record.check_in_confidence = confidence
            record.status = status_value

        await self.db.commit()
        await self.db.refresh(record)
        return record

    def _compute_checkin_status(self, employee: Employee, timestamp: datetime) -> AttendanceStatus:
        """Late if shift_start_time set and checkin is after it, else present."""
        if not employee.shift_start_time:
            return AttendanceStatus.PRESENT
        try:
            hh, mm = map(int, employee.shift_start_time.split(":"))
        except (ValueError, AttributeError):
            return AttendanceStatus.PRESENT

        shift_start = timestamp.replace(hour=hh, minute=mm, second=0, microsecond=0)
        return AttendanceStatus.LATE if timestamp > shift_start else AttendanceStatus.PRESENT

    # ------------------------------------------------------------------
    # CHECK-OUT
    # ------------------------------------------------------------------
    async def record_checkout(
        self,
        employee: Employee,
        camera_id: UUID,
        timestamp: datetime,
        confidence: float,
    ) -> Optional[AttendanceRecord]:
        """
        Set check_out_time + total_hours on today's existing record.
        Returns None if no check-in yet, or suppressed by cooldown.
        """
        work_date = timestamp.date()
        record = await self.repo.get_by_employee_and_date(employee.id, work_date)

        if record is None or record.check_in_time is None:
            return None  # cannot check out without a check-in

        if record.check_out_time is not None:
            elapsed = timestamp - record.check_out_time
            if elapsed < timedelta(minutes=AppConstants.ATTENDANCE_COOLDOWN_MINUTES):
                return None

        record.check_out_time = timestamp
        record.check_out_camera_id = camera_id
        record.check_out_confidence = confidence
        record.total_hours = round(
            (timestamp - record.check_in_time).total_seconds() / 3600, 2
        )

        await self.db.commit()
        await self.db.refresh(record)
        return record

    # ------------------------------------------------------------------
    # READ
    # ------------------------------------------------------------------
    async def get_by_id(self, attendance_id: UUID) -> AttendanceRecord:
        record = await self.repo.get_by_id(str(attendance_id))
        if not record:
            raise ValueError("Attendance record not found")
        return record

    async def get_today(self, skip: int = 0, limit: int = 100) -> List[AttendanceRecord]:
        return await self.repo.list_by_date(date.today(), skip=skip, limit=limit)

    async def get_by_date(self, work_date: date, skip: int = 0, limit: int = 100) -> List[AttendanceRecord]:
        return await self.repo.list_by_date(work_date, skip=skip, limit=limit)

    async def get_by_employee(self, employee_id: UUID, skip: int = 0, limit: int = 100) -> List[AttendanceRecord]:
        return await self.repo.list_by_employee(employee_id, skip=skip, limit=limit)

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[AttendanceRecord]:
        return await self.repo.list_all(skip=skip, limit=limit)

    # ------------------------------------------------------------------
    # MANUAL OVERRIDE
    # ------------------------------------------------------------------
    async def manual_override(
        self,
        attendance_id: UUID,
        status_value: Optional[AttendanceStatus] = None,
        check_in_time: Optional[datetime] = None,
        check_out_time: Optional[datetime] = None,
        reason: Optional[str] = None,
    ) -> AttendanceRecord:
        record = await self.get_by_id(attendance_id)

        if status_value is not None:
            record.status = status_value
        if check_in_time is not None:
            record.check_in_time = check_in_time
        if check_out_time is not None:
            record.check_out_time = check_out_time
        if record.check_in_time and record.check_out_time:
            record.total_hours = round(
                (record.check_out_time - record.check_in_time).total_seconds() / 3600, 2
            )

        record.is_manual_override = True
        record.override_reason = reason

        await self.db.commit()
        await self.db.refresh(record)
        return record

    # ------------------------------------------------------------------
    # AUTO CHECKIN/CHECKOUT TOGGLE (called from recognition loop)
    # ------------------------------------------------------------------
    async def process_recognition(
        self,
        employee: Employee,
        camera_id: UUID,
        timestamp: datetime,
        confidence: float,
    ) -> Optional[AttendanceRecord]:
        """
        Decide checkin vs checkout based on today's record state:
          - no record / no check_in_time  -> checkin
          - checked in, not checked out, cooldown passed -> checkout
          - otherwise -> no-op (cooldown or already closed for today)
        """
        work_date = timestamp.date()
        record = await self.repo.get_by_employee_and_date(employee.id, work_date)

        if record is None or record.check_in_time is None:
            return await self.record_checkin(employee, camera_id, timestamp, confidence)

        if record.check_out_time is None:
            elapsed = timestamp - record.check_in_time
            if elapsed >= timedelta(minutes=AppConstants.ATTENDANCE_COOLDOWN_MINUTES):
                return await self.record_checkout(employee, camera_id, timestamp, confidence)
            return None  # still in cooldown since checkin

        return None  # already checked in and out today
