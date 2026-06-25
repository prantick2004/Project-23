"""
Employee ORM model.
"""
import uuid
from datetime import datetime, time
from sqlalchemy import String, Boolean, DateTime, Text, Time, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.infrastructure.database.connection import Base
from app.core.constants import EmployeeStatus

class EmployeeModel(Base):
    __tablename__ = "employees"
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    employee_code: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False
    )
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    department_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
    )
    designation: Mapped[str] = mapped_column(String(100), nullable=True)
    contact_number: Mapped[str] = mapped_column(String(20), nullable=True)
    email: Mapped[str] = mapped_column(String(254), unique=True, nullable=True)
    status: Mapped[str] = mapped_column(
        SAEnum(EmployeeStatus, name="employee_status"),
        default=EmployeeStatus.ACTIVE, nullable=False
    )
    profile_image_path: Mapped[str] = mapped_column(String(512), nullable=True)
    face_encoded: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    work_shift_start: Mapped[time] = mapped_column(Time, nullable=True)
    work_shift_end: Mapped[time] = mapped_column(Time, nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    registered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow,
        onupdate=datetime.utcnow, nullable=False
    )
    department: Mapped["DepartmentModel"] = relationship(
        "DepartmentModel", back_populates="employees"
    )
    face_encodings: Mapped[list] = relationship(
        "FaceEncodingModel", back_populates="employee",
        cascade="all, delete-orphan"
    )
    attendance_records: Mapped[list] = relationship(
        "AttendanceModel", back_populates="employee",
        cascade="all, delete-orphan"
    )
    def __repr__(self) -> str:
        return f"<Employee {self.employee_code} - {self.full_name}>"
