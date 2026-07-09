"""
FaceEncoding Repository — async database operations for FaceEncoding model.
"""
from typing import List, Dict, Optional
import numpy as np
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.base_repository import BaseRepository
from app.infrastructure.database.models.face_encoding import FaceEncoding


class FaceEncodingRepository(BaseRepository[FaceEncoding]):
    """Handles all FaceEncoding database operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(FaceEncoding, db)

    async def get_active_by_employee(self, employee_id: str) -> List[FaceEncoding]:
        """Fetch all active encodings for one employee."""
        result = await self.db.execute(
            select(FaceEncoding).where(
                FaceEncoding.employee_id == employee_id,
                FaceEncoding.is_active == True,
            )
        )
        return result.scalars().all()

    async def deactivate_all_for_employee(self, employee_id: str) -> None:
        """Soft-invalidate existing encodings before generating fresh ones."""
        encodings = await self.get_active_by_employee(employee_id)
        for enc in encodings:
            enc.is_active = False
            self.db.add(enc)
        await self.db.commit()

    async def create_encoding(
        self,
        employee_id: str,
        encoding_vector: np.ndarray,
        image_path: Optional[str],
        quality_score: float,
    ) -> FaceEncoding:
        """Persist one 128-d encoding as raw bytes (BYTEA column)."""
        entity = FaceEncoding(
            employee_id=employee_id,
            encoding_vector=encoding_vector.astype(np.float64).tobytes(),
            image_path=image_path,
            quality_score=quality_score,
            is_active=True,
        )
        return await self.create(entity)

    async def get_all_active_grouped_by_employee(self) -> Dict[str, List[np.ndarray]]:
        """
        Fetch every active encoding, grouped by employee_id, deserialized
        back into numpy arrays. Used to (re)build the in-memory EncodingCache.
        """
        result = await self.db.execute(
            select(FaceEncoding).where(FaceEncoding.is_active == True)
        )
        rows = result.scalars().all()

        grouped: Dict[str, List[np.ndarray]] = {}
        for row in rows:
            vec = np.frombuffer(row.encoding_vector, dtype=np.float64)
            grouped.setdefault(str(row.employee_id), []).append(vec)

        return grouped
