"""
Camera Service — business logic for camera management.
Orchestrates CameraRepository (DB) and CameraStreamManager (live threads).
"""
import uuid
from typing import Optional, List

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.camera_repository import CameraRepository
from app.infrastructure.database.models.camera import Camera
from app.infrastructure.camera.stream_manager import stream_manager
from app.core.constants import CameraStatus


class CameraService:
    """Handles all camera business logic — CRUD plus stream lifecycle."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.camera_repo = CameraRepository(db)

    # ── CRUD ──────────────────────────────────────────────────────────

    async def create_camera(self, data: dict) -> Camera:
        if await self.camera_repo.get_by_camera_code(data["camera_code"]):
            raise ValueError(f"Camera code '{data['camera_code']}' already exists")

        camera = Camera(
            id=uuid.uuid4(),
            camera_code=data["camera_code"],
            name=data["name"],
            camera_type=data["camera_type"],
            connection_string=data["connection_string"],
            location=data.get("location"),
            is_active=data.get("is_active", True),
            status=CameraStatus.OFFLINE.value,
            resolution_width=data.get("resolution_width", 1280),
            resolution_height=data.get("resolution_height", 720),
            fps_target=data.get("fps_target", 15),
            is_attendance_cam=data.get("is_attendance_cam", False),
            is_activity_cam=data.get("is_activity_cam", True),
            zone_config=data.get("zone_config"),
        )
        return await self.camera_repo.create(camera)

    async def get_camera(self, camera_id: str) -> Camera:
        camera = await self.camera_repo.get_by_id(camera_id)
        if not camera:
            raise ValueError("Camera not found")
        return camera

    async def get_all_cameras(self, skip: int = 0, limit: int = 100) -> List[Camera]:
        return await self.camera_repo.get_all(skip=skip, limit=limit)

    async def update_camera(self, camera_id: str, data: dict) -> Camera:
        camera = await self.get_camera(camera_id)
        allowed = [
            "name", "connection_string", "location", "is_active",
            "resolution_width", "resolution_height", "fps_target",
            "is_attendance_cam", "is_activity_cam", "zone_config",
        ]
        for field in allowed:
            if field in data:
                setattr(camera, field, data[field])
        return await self.camera_repo.update(camera)

    async def delete_camera(self, camera_id: str) -> None:
        camera = await self.get_camera(camera_id)
        if stream_manager.is_running(str(camera.id)):
            stream_manager.stop_camera(str(camera.id))
        await self.camera_repo.delete(camera)

    # ── STREAM LIFECYCLE ─────────────────────────────────────────────

    async def start_stream(self, camera_id: str) -> dict:
        camera = await self.get_camera(camera_id)
        started = stream_manager.start_camera(
            camera_id=str(camera.id),
            camera_type=camera.camera_type,
            connection_string=camera.connection_string,
            camera_code=camera.camera_code,
        )
        new_status = CameraStatus.ONLINE.value if started else CameraStatus.ERROR.value
        await self.camera_repo.update_status(camera_id, new_status)

        if not started:
            raise ValueError(f"Camera '{camera.camera_code}' failed to connect")

        return {"camera_id": camera_id, "status": new_status, "message": "Stream started"}

    async def stop_stream(self, camera_id: str) -> dict:
        camera = await self.get_camera(camera_id)
        stream_manager.stop_camera(str(camera.id))
        await self.camera_repo.update_status(camera_id, CameraStatus.OFFLINE.value)
        return {"camera_id": camera_id, "status": CameraStatus.OFFLINE.value, "message": "Stream stopped"}

    async def get_status(self, camera_id: str) -> dict:
        camera = await self.get_camera(camera_id)
        running = stream_manager.is_running(str(camera.id))
        heartbeat = stream_manager.get_last_heartbeat(str(camera.id))
        return {
            "camera_id": camera_id,
            "camera_code": camera.camera_code,
            "db_status": camera.status,
            "is_streaming": running,
            "last_heartbeat": heartbeat.isoformat() if heartbeat else None,
        }

    def get_snapshot_frame(self, camera_id: str):
        """Returns latest raw frame (np.ndarray) or None. Router encodes to JPEG."""
        return stream_manager.get_frame(camera_id)
