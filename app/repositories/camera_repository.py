"""
Camera Repository — async database operations for Camera model.
"""
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.base_repository import BaseRepository
from app.infrastructure.database.models.camera import Camera


class CameraRepository(BaseRepository[Camera]):
    """Handles all Camera database operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(Camera, db)

    async def get_by_camera_code(self, camera_code: str) -> Optional[Camera]:
        result = await self.db.execute(
            select(Camera).where(Camera.camera_code == camera_code)
        )
        return result.scalar_one_or_none()

    async def get_active_cameras(self) -> List[Camera]:
        result = await self.db.execute(
            select(Camera).where(Camera.is_active == True)
        )
        return result.scalars().all()

    async def update_status(self, camera_id: str, status: str) -> Optional[Camera]:
        camera = await self.get_by_id(camera_id)
        if camera:
            camera.status = status
            return await self.update(camera)
        return None

    async def update_heartbeat(self, camera_id: str, heartbeat) -> Optional[Camera]:
        camera = await self.get_by_id(camera_id)
        if camera:
            camera.last_heartbeat = heartbeat
            return await self.update(camera)
        return None
