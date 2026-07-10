"""
Attendance Pydantic schemas — request/response validation.
"""
from typing import Optional
from uuid import UUID
from datetime import datetime, date
from pydantic import BaseModel

from app.core.constants import AttendanceStatus


class AttendanceResponse(BaseModel):
    id: UUID
    employee_id: UUID
    work_date: date
    check_in_time: Optional[datetime]
    check_out_time: Optional[datetime]
    total_hours: Optional[float]
    status: AttendanceStatus
    check_in_camera_id: Optional[UUID]
    check_out_camera_id: Optional[UUID]
    check_in_confidence: Optional[float]
    check_out_confidence: Optional[float]
    is_manual_override: bool
    override_reason: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class AttendanceListResponse(BaseModel):
    total: int
    records: list[AttendanceResponse]


class AttendanceOverrideRequest(BaseModel):
    status: Optional[AttendanceStatus] = None
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    reason: Optional[str] = None
