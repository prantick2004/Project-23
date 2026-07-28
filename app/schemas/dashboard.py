"""
Pydantic schemas for Dashboard API — GET /dashboard/stats etc.
"""
from typing import List, Optional
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class DashboardStatsResponse(BaseModel):
    """GET /dashboard/stats — top-level live summary."""
    employees_present_today: int
    active_cameras: int
    total_cameras: int
    pending_alerts: int
    today_incident_count: int
    generated_at: datetime


class CameraStatusItem(BaseModel):
    id: UUID
    camera_code: str
    name: str
    status: str
    is_active: bool
    last_heartbeat: Optional[datetime]


class DashboardCamerasResponse(BaseModel):
    total: int
    cameras: List[CameraStatusItem]


class LiveAttendanceItem(BaseModel):
    employee_id: UUID
    employee_name: str
    check_in_time: Optional[datetime]
    check_out_time: Optional[datetime]
    status: str


class DashboardLiveAttendanceResponse(BaseModel):
    total: int
    records: List[LiveAttendanceItem]


class RecentAlertItem(BaseModel):
    id: UUID
    severity: str
    title: str
    message: str
    is_acknowledged: bool
    created_at: datetime


class DashboardRecentAlertsResponse(BaseModel):
    total: int
    alerts: List[RecentAlertItem]
