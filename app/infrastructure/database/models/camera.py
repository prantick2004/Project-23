"""
Camera ORM model.
"""
import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Integer, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.infrastructure.database.connection import Base
from app.core.constants import CameraType, CameraStatus

class Camera(Base):
    __tablename__ = "cameras"
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    camera_code: Mapped[str] = mapped_column(
        String(30), unique=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    camera_type: Mapped[str] = mapped_column(
        SAEnum(CameraType, name="camera_type"), nullable=False
    )
    connection_string: Mapped[str] = mapped_column(String(512), nullable=False)
    location: Mapped[str] = mapped_column(String(200), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    status: Mapped[str] = mapped_column(
        SAEnum(CameraStatus, name="camera_status"),
        default=CameraStatus.OFFLINE, nullable=False
    )
    resolution_width: Mapped[int] = mapped_column(Integer, default=1280)
    resolution_height: Mapped[int] = mapped_column(Integer, default=720)
    fps_target: Mapped[int] = mapped_column(Integer, default=15)
    is_attendance_cam: Mapped[bool] = mapped_column(Boolean, default=False)
    is_activity_cam: Mapped[bool] = mapped_column(Boolean, default=True)
    zone_config: Mapped[dict] = mapped_column(JSONB, nullable=True)
    last_heartbeat: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow,
        onupdate=datetime.utcnow, nullable=False
    )
    def __repr__(self) -> str:
        return f"<Camera {self.camera_code} - {self.name}>"
