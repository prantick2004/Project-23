"""
DashboardService — aggregates existing repositories/services into
live summary stats. No new detection/dispatch logic — pure read-side.
"""
from datetime import date, datetime, time, timezone
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.attendance_repository import AttendanceRepository
from app.repositories.activity_repository import ActivityRepository
from app.repositories.alert_repository import AlertRepository
from app.services.camera_service import CameraService
from app.core.constants import AttendanceStatus, ActivityType, CameraStatus

# Matches Phase 9's incident report definition — do not change without
# checking report_service.py's incident filter for consistency.
INCIDENT_TYPES = [
    ActivityType.UNAUTHORIZED_ACCESS,
    ActivityType.RESTRICTED_AREA_VIOLATION,
    ActivityType.SUSPICIOUS_ACTIVITY,
    ActivityType.UNKNOWN_PERSON_DETECTED,
]


class DashboardService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.attendance_repo = AttendanceRepository(db)
        self.activity_repo = ActivityRepository(db)
        self.alert_repo = AlertRepository(db)
        self.camera_service = CameraService(db)

    async def get_stats(self) -> dict:
        today = date.today()

        attendance_today = await self.attendance_repo.list_by_date(today, skip=0, limit=1000)
        present_count = sum(
            1 for a in attendance_today
            if a.status in (AttendanceStatus.PRESENT, AttendanceStatus.LATE)
        )

        cameras = await self.camera_service.get_all_cameras(skip=0, limit=500)
        active_cameras = sum(1 for c in cameras if c.status == CameraStatus.ONLINE)
        total_cameras = len(cameras)

        pending_alerts = await self.alert_repo.unread_count()

        day_start = datetime.combine(today, time.min, tzinfo=timezone.utc)
        day_end   = datetime.combine(today, time.max, tzinfo=timezone.utc)
        incident_count = 0
        for itype in INCIDENT_TYPES:
            rows = await self.activity_repo.list_by_date_range(
                date_from=day_start, date_to=day_end, activity_type=itype,
            )
            incident_count += len(rows)

        return {
            "employees_present_today": present_count,
            "active_cameras": active_cameras,
            "total_cameras": total_cameras,
            "pending_alerts": pending_alerts,
            "today_incident_count": incident_count,
            "generated_at": datetime.now(timezone.utc),
        }

    async def get_cameras(self) -> dict:
        cameras = await self.camera_service.get_all_cameras(skip=0, limit=500)
        items = [
            {
                "id": c.id,
                "camera_code": c.camera_code,
                "name": c.name,
                "status": c.status.value if hasattr(c.status, "value") else c.status,
                "is_active": c.is_active,
                "last_heartbeat": c.last_heartbeat,
            }
            for c in cameras
        ]
        return {"total": len(items), "cameras": items}

    async def get_live_attendance(self) -> dict:
        today = date.today()
        records = await self.attendance_repo.list_by_date_range(date_from=today, date_to=today)
        items = [
            {
                "employee_id": r.employee_id,
                "employee_name": r.employee.full_name if r.employee else "Unknown",
                "check_in_time": r.check_in_time,
                "check_out_time": r.check_out_time,
                "status": r.status.value if hasattr(r.status, "value") else r.status,
            }
            for r in records
        ]
        return {"total": len(items), "records": items}

    async def get_recent_alerts(self, limit: int = 20) -> dict:
        alerts = await self.alert_repo.list_all(skip=0, limit=limit)
        items = [
            {
                "id": a.id,
                "severity": a.severity.value if hasattr(a.severity, "value") else a.severity,
                "title": a.title,
                "message": a.message,
                "is_acknowledged": a.is_acknowledged,
                "created_at": a.created_at,
            }
            for a in alerts
        ]
        return {"total": len(items), "alerts": items}
