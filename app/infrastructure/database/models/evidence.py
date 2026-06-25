"""
Evidence ORM model.
"""
import uuid
from datetime import datetime
from sqlalchemy import DateTime, Boolean, Integer, String, BigInteger, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.infrastructure.database.connection import Base

class EvidenceModel(Base):
    __tablename__ = "evidence_records"
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    activity_log_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("activity_logs.id", ondelete="CASCADE"), nullable=False
    )
    camera_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cameras.id", ondelete="CASCADE"), nullable=False
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    screenshot_path: Mapped[str] = mapped_column(String(512), nullable=True)
    video_clip_path: Mapped[str] = mapped_column(String(512), nullable=True)
    thumbnail_path: Mapped[str] = mapped_column(String(512), nullable=True)
    file_size_bytes: Mapped[int] = mapped_column(BigInteger, default=0)
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=True)
    captured_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, nullable=True)
    activity_log: Mapped["ActivityLogModel"] = relationship(
        "ActivityLogModel", back_populates="evidence"
    )
    def __repr__(self) -> str:
        return f"<Evidence {self.id}>"
