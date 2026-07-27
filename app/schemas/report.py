"""
Pydantic schemas for Report API — request bodies and response models.
"""
from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, field_validator

from app.core.constants import ActivityType, ReportFormat


class AttendanceReportRequest(BaseModel):
    date_from: date
    date_to: date
    format: ReportFormat
    department_id: Optional[UUID] = None
    employee_id: Optional[UUID] = None

    @field_validator("date_to")
    @classmethod
    def check_range(cls, v, info):
        date_from = info.data.get("date_from")
        if date_from and v < date_from:
            raise ValueError("date_to must be >= date_from")
        return v


class ActivityReportRequest(BaseModel):
    date_from: date
    date_to: date
    format: ReportFormat
    activity_type: Optional[ActivityType] = None
    employee_id: Optional[UUID] = None
    camera_id: Optional[UUID] = None

    @field_validator("date_to")
    @classmethod
    def check_range(cls, v, info):
        date_from = info.data.get("date_from")
        if date_from and v < date_from:
            raise ValueError("date_to must be >= date_from")
        return v


class IncidentReportRequest(BaseModel):
    date_from: date
    date_to: date
    format: ReportFormat

    @field_validator("date_to")
    @classmethod
    def check_range(cls, v, info):
        date_from = info.data.get("date_from")
        if date_from and v < date_from:
            raise ValueError("date_to must be >= date_from")
        return v


class ReportGeneratedResponse(BaseModel):
    filename: str
    row_count: int
    generated_at: datetime
    download_url: str


class ReportJobResponse(BaseModel):
    job_id: str
    status: str


class ReportJobStatusResponse(BaseModel):
    job_id: str
    status: str
    filename: Optional[str] = None
    row_count: Optional[int] = None
    download_url: Optional[str] = None
    error: Optional[str] = None
