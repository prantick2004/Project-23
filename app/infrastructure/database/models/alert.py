"""
Alert ORM model.
"""
import uuid
from datetime import datetime
from sqlalchemy import DateTime, Boolean, Text, String, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.infrastructure.database.connection import Base
from app.core.constants import AlertSeverity

class AlertModel(Base):
    __tablename__ = "alerts"
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    activity_log_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("activity_logs.id", ondelete="SET NULL"), nullable=True
    )
    alert_type: Mapped[str] = mapped_column(String(100), nullable=False)
    severity: Mapped[str] = mapped_column(
        SAEnum(AlertSeverity, name="alert_severity"),
        default=AlertSeverity.MEDIUM, nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    acknowledged_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    acknowledged_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    channels_sent: Mapped[dict] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    activity_log: Mapped["ActivityLog"] = relationship(
        "ActivityLog", back_populates="alerts"
    )
    def __repr__(self) -> str:
        return f"<Alert {self.alert_type} - {self.severity}>"
