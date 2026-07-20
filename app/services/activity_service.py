"""
ActivityService -- business logic for activity detection events.
Cooldown-based dedup, DB writes, and read/resolve operations.
Mirrors the pattern established by AttendanceService in Phase 6.
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.activity_repository import ActivityRepository
from app.infrastructure.database.models.activity import ActivityLog
from app.core.constants import ActivityType, AppConstants


class ActivityService:
    """Handles all activity-log business logic: create with cooldown, list, resolve."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = ActivityRepository(db)

    async def process_detection(
        self,
        camera_id: uuid.UUID,
        activity_type: ActivityType,
        confidence_score: float,
        bounding_box: Optional[dict] = None,
        description: Optional[str] = None,
        employee_id: Optional[uuid.UUID] = None,
        duration_seconds: Optional[int] = None,
    ) -> Optional[ActivityLog]:
        """
        Create a new activity log entry, unless a matching event for the
        same employee+camera+type was already logged within the cooldown
        window (ACTIVITY_COOLDOWN_MINUTES). Returns the created log, or
        None if suppressed by cooldown.
        """
        now = datetime.now(timezone.utc)
        cooldown_start = now - timedelta(minutes=AppConstants.ACTIVITY_COOLDOWN_MINUTES)

        existing = await self.repo.get_recent_by_employee_camera_type(
            employee_id=employee_id,
            camera_id=camera_id,
            activity_type=activity_type,
            since=cooldown_start,
        )
        if existing is not None:
            return None  # still in cooldown, suppress duplicate

        log = ActivityLog(
            id=uuid.uuid4(),
            employee_id=employee_id,
            camera_id=camera_id,
            activity_type=activity_type,
            description=description,
            confidence_score=confidence_score,
            bounding_box=bounding_box,
            duration_seconds=duration_seconds,
            is_resolved=False,
            detected_at=now,
        )
        return await self.repo.create(log)

    async def get_activity(self, activity_id: str) -> ActivityLog:
        log = await self.repo.get_by_id(activity_id)
        if not log:
            raise ValueError("Activity log not found")
        return log

    async def list_activities(
        self,
        skip: int = 0,
        limit: int = 50,
        employee_id: Optional[str] = None,
        camera_id: Optional[str] = None,
        activity_type: Optional[ActivityType] = None,
        is_resolved: Optional[bool] = None,
    ) -> List[ActivityLog]:
        return await self.repo.list_all(
            skip=skip,
            limit=limit,
            employee_id=uuid.UUID(employee_id) if employee_id else None,
            camera_id=uuid.UUID(camera_id) if camera_id else None,
            activity_type=activity_type,
            is_resolved=is_resolved,
        )

    async def resolve_activity(self, activity_id: str) -> ActivityLog:
        log = await self.get_activity(activity_id)
        log.is_resolved = True
        log.resolved_at = datetime.now(timezone.utc)
        return await self.repo.update(log)

    async def stats_by_type(self) -> List[dict]:
        return await self.repo.count_by_type()
