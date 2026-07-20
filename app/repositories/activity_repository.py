"""
ActivityRepository -- DB queries for ActivityLog, on top of BaseRepository.
"""
import uuid
from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.base_repository import BaseRepository
from app.infrastructure.database.models.activity import ActivityLog
from app.core.constants import ActivityType


class ActivityRepository(BaseRepository[ActivityLog]):
    """All DB operations for ActivityLog entities."""

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(ActivityLog, db)

    async def get_recent_by_employee_camera_type(
        self,
        employee_id: Optional[uuid.UUID],
        camera_id: uuid.UUID,
        activity_type: ActivityType,
        since: datetime,
    ) -> Optional[ActivityLog]:
        """
        Find the most recent matching activity log within a cooldown window.
        Used by ActivityService to suppress duplicate events.
        employee_id may be None (unknown person events).
        """
        conditions = [
            ActivityLog.camera_id == camera_id,
            ActivityLog.activity_type == activity_type,
            ActivityLog.detected_at >= since,
        ]
        if employee_id is not None:
            conditions.append(ActivityLog.employee_id == employee_id)
        else:
            conditions.append(ActivityLog.employee_id.is_(None))

        result = await self.db.execute(
            select(ActivityLog)
            .where(and_(*conditions))
            .order_by(ActivityLog.detected_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def list_all(
        self,
        skip: int = 0,
        limit: int = 50,
        employee_id: Optional[uuid.UUID] = None,
        camera_id: Optional[uuid.UUID] = None,
        activity_type: Optional[ActivityType] = None,
        is_resolved: Optional[bool] = None,
    ) -> List[ActivityLog]:
        """Paginated, filterable list of activity logs, newest first."""
        conditions = []
        if employee_id is not None:
            conditions.append(ActivityLog.employee_id == employee_id)
        if camera_id is not None:
            conditions.append(ActivityLog.camera_id == camera_id)
        if activity_type is not None:
            conditions.append(ActivityLog.activity_type == activity_type)
        if is_resolved is not None:
            conditions.append(ActivityLog.is_resolved == is_resolved)

        query = select(ActivityLog)
        if conditions:
            query = query.where(and_(*conditions))
        query = query.order_by(ActivityLog.detected_at.desc()).offset(skip).limit(limit)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def count_by_type(self) -> List[dict]:
        """Count of activity logs grouped by activity_type."""
        from sqlalchemy import func
        result = await self.db.execute(
            select(ActivityLog.activity_type, func.count(ActivityLog.id))
            .group_by(ActivityLog.activity_type)
        )
        return [{"activity_type": row[0], "count": row[1]} for row in result.all()]
