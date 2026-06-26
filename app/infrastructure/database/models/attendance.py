"""
AttendanceRecord ORM model.
"""
import uuid
from datetime import datetime, date
from sqlalchemy import Date, DateTime, Float, Boolean, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.infrastructure.database.connection import Base
from app.core.constants import AttendanceStatus

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("employees.id", ondelete="CASCADE"), nullable=False
    )
    work_date: Mapped[date] = mapped_column(Date, nullable=False)
    check_in_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    check_out_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    total_hours: Mapped[float] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(
        SAEnum(AttendanceStatus, name="attendance_status"),
        default=AttendanceStatus.ABSENT, nullable=False
    )
    check_in_camera_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cameras.id", ondelete="SET NULL"), nullable=True
    )
    check_out_camera_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cameras.id", ondelete="SET NULL"), nullable=True
    )
    check_in_confidence: Mapped[float] = mapped_column(Float, nullable=True)
    check_out_confidence: Mapped[float] = mapped_column(Float, nullable=True)
    is_manual_override: Mapped[bool] = mapped_column(Boolean, default=False)
    override_reason: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow,
        onupdate=datetime.utcnow, nullable=False
    )
    employee: Mapped["Employee"] = relationship(
        "Employee", back_populates="attendance_records"
    )
    def __repr__(self) -> str:
        return f"<Attendance {self.employee_id} - {self.work_date}>"
