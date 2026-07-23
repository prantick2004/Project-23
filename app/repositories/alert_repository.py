"""
Alert Repository — DB queries for Alert (alerts table).
"""
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.base_repository import BaseRepository
from app.infrastructure.database.models.alert import Alert
from app.core.constants import AlertSeverity


class AlertRepository(BaseRepository[Alert]):
    """Alert-specific queries beyond generic CRUD."""

    def __init__(self, db: AsyncSession):
        super().__init__(Alert, db)

    async def list_all(
        self,
        skip: int = 0,
        limit: int = 50,
        severity: Optional[AlertSeverity] = None,
        is_acknowledged: Optional[bool] = None,
    ) -> List[Alert]:
        """Paginated alert list with optional filters."""
        query = select(Alert)
        if severity is not None:
            query = query.where(Alert.severity == severity)
        if is_acknowledged is not None:
            query = query.where(Alert.is_acknowledged == is_acknowledged)
        query = query.order_by(Alert.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def unread_count(self) -> int:
        """Count of unacknowledged alerts."""
        result = await self.db.execute(
            select(func.count()).select_from(Alert).where(Alert.is_acknowledged == False)  # noqa: E712
        )
        return result.scalar() or 0

    async def acknowledge(self, alert: Alert, user_id: UUID) -> Alert:
        """Mark alert acknowledged. Caller passes an already-fetched, attached object."""
        alert.is_acknowledged = True
        alert.acknowledged_by = user_id
        alert.acknowledged_at = datetime.now(timezone.utc)
        return await self.update(alert)
