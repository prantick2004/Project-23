"""
ActivityLog ORM model.
"""
import uuid
from datetime import datetime
from sqlalchemy import DateTime, Float, Boolean, Text, Integer, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.infrastructure.database.connection import Base
from app.core.constants import ActivityType

class ActivityLogModel(Base):
    __tablename__ = "activity_logs"
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    camera_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cameras.id", ondelete="CASCADE"), nullable=False
    )
    activity_type: Mapped[str] = mapped_column(
        SAEnum(ActivityType, name="activity_type"), nullable=False
    )
    description: Mapped[str] = mapped_column(Text, nullable=True)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=True)
    bounding_box: Mapped[dict] = mapped_column(JSONB, nullable=True)
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=True)
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    resolved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, nullable=True)
    detected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    evidence: Mapped[list] = relationship(
        "EvidenceModel", back_populates="activity_log",
        cascade="all, delete-orphan"
    )
    alerts: Mapped[list] = relationship(
        "AlertModel", back_populates="activity_log"
    )
    def __repr__(self) -> str:
        return f"<ActivityLog {self.activity_type} at {self.detected_at}>"
