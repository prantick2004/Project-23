"""
Alert Service — business logic for alerts: creation from detected events,
listing, and acknowledgement. Dispatch to WebSocket clients happens in the
caller (stream_manager's async processor), keeping this service DB-only.
"""
from typing import List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.repositories.alert_repository import AlertRepository
from app.infrastructure.database.models.alert import Alert
from app.core.constants import ActivityType, AlertSeverity

logger = structlog.get_logger(__name__)

# Maps each activity type to a default alert severity.
SEVERITY_MAP = {
    ActivityType.RESTRICTED_AREA_VIOLATION: AlertSeverity.CRITICAL,
    ActivityType.UNAUTHORIZED_ACCESS:       AlertSeverity.CRITICAL,
    ActivityType.MOBILE_PHONE_USAGE:        AlertSeverity.HIGH,
    ActivityType.SUSPICIOUS_ACTIVITY:       AlertSeverity.HIGH,
    ActivityType.UNKNOWN_PERSON_DETECTED:   AlertSeverity.HIGH,
    ActivityType.SLEEPING:                  AlertSeverity.MEDIUM,
    ActivityType.LONG_INACTIVITY:           AlertSeverity.MEDIUM,
    ActivityType.WORKSTATION_ABSENCE:       AlertSeverity.MEDIUM,
    ActivityType.CAMERA_FAILURE:            AlertSeverity.LOW,
    ActivityType.SYSTEM_EVENT:              AlertSeverity.INFO,
}


class AlertService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = AlertRepository(db)

    async def create_alert(
        self,
        activity_log_id: UUID,
        activity_type: ActivityType,
        camera_code: str,
        employee_name: Optional[str] = None,
    ) -> Alert:
        """Create an alert row for a freshly-logged activity event."""
        severity = SEVERITY_MAP.get(activity_type, AlertSeverity.MEDIUM)
        who = employee_name or "Unknown person"
        title = activity_type.value.replace("_", " ").title()
        message = f"{title} detected on camera '{camera_code}' ({who})"

        alert = Alert(
            activity_log_id=activity_log_id,
            alert_type=activity_type.value,
            severity=severity,
            title=title,
            message=message,
            is_acknowledged=False,
            channels_sent={"dashboard": True},
        )
        return await self.repo.create(alert)

    async def list_alerts(
        self,
        skip: int = 0,
        limit: int = 50,
        severity: Optional[AlertSeverity] = None,
        is_acknowledged: Optional[bool] = None,
    ) -> List[Alert]:
        return await self.repo.list_all(
            skip=skip, limit=limit, severity=severity, is_acknowledged=is_acknowledged
        )

    async def get_alert(self, alert_id: str) -> Alert:
        alert = await self.repo.get_by_id(alert_id)
        if alert is None:
            raise ValueError(f"Alert '{alert_id}' not found")
        return alert

    async def acknowledge_alert(self, alert_id: str, user_id: UUID) -> Alert:
        alert = await self.get_alert(alert_id)
        if alert.is_acknowledged:
            return alert
        return await self.repo.acknowledge(alert, user_id)

    async def unread_count(self) -> int:
        return await self.repo.unread_count()
