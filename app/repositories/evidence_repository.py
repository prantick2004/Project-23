"""
Evidence Repository — DB queries for Evidence (evidence_records table).
"""
from typing import List, Optional
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.base_repository import BaseRepository
from app.infrastructure.database.models.evidence import Evidence


class EvidenceRepository(BaseRepository[Evidence]):
    """Evidence-specific queries beyond generic CRUD."""

    def __init__(self, db: AsyncSession):
        super().__init__(Evidence, db)

    async def list_all(
        self,
        skip: int = 0,
        limit: int = 50,
        employee_id: Optional[str] = None,
        camera_id: Optional[str] = None,
        activity_log_id: Optional[str] = None,
    ) -> List[Evidence]:
        """Paginated evidence list with optional filters."""
        query = select(Evidence)
        if employee_id:
            query = query.where(Evidence.employee_id == UUID(employee_id))
        if camera_id:
            query = query.where(Evidence.camera_id == UUID(camera_id))
        if activity_log_id:
            query = query.where(Evidence.activity_log_id == UUID(activity_log_id))
        query = query.order_by(Evidence.captured_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_activity_log(self, activity_log_id: UUID) -> Optional[Evidence]:
        """Fetch evidence linked to a specific activity log."""
        result = await self.db.execute(
            select(Evidence).where(Evidence.activity_log_id == activity_log_id)
        )
        return result.scalar_one_or_none()
