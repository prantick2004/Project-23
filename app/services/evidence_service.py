"""
Evidence Service — business logic for evidence records.
Evidence rows are created only from the detection pipeline (stream_manager),
same read-mostly pattern as Activity/Attendance in Phases 6/7.
"""
from typing import List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.evidence_repository import EvidenceRepository
from app.infrastructure.database.models.evidence import Evidence
from app.infrastructure.storage.media_handler import media_handler
import numpy as np
import structlog

logger = structlog.get_logger(__name__)


class EvidenceService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = EvidenceRepository(db)

    async def capture_evidence(
        self,
        activity_log_id: UUID,
        camera_id: UUID,
        activity_type: str,
        frame_bgr: np.ndarray,
        employee_id: Optional[UUID] = None,
    ) -> Optional[Evidence]:
        """
        Save a screenshot to disk and create the linked evidence_records row.
        Returns None if the screenshot save failed (does not raise —
        a failed screenshot should not crash the detection pipeline).
        """
        saved = media_handler.save_screenshot(
            frame_bgr=frame_bgr,
            camera_id=str(camera_id),
            activity_type=activity_type,
        )
        if saved is None:
            return None

        evidence = Evidence(
            activity_log_id=activity_log_id,
            camera_id=camera_id,
            employee_id=employee_id,
            screenshot_path=saved["screenshot_path"],
            file_size_bytes=saved["file_size_bytes"],
            is_archived=False,
        )
        return await self.repo.create(evidence)

    async def list_evidence(
        self,
        skip: int = 0,
        limit: int = 50,
        employee_id: Optional[str] = None,
        camera_id: Optional[str] = None,
    ) -> List[Evidence]:
        return await self.repo.list_all(
            skip=skip, limit=limit, employee_id=employee_id, camera_id=camera_id
        )

    async def get_evidence(self, evidence_id: str) -> Evidence:
        evidence = await self.repo.get_by_id(evidence_id)
        if evidence is None:
            raise ValueError(f"Evidence '{evidence_id}' not found")
        return evidence
