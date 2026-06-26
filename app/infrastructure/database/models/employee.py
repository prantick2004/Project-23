"""
Employee ORM model — maps to 'employees' table in PostgreSQL.
"""
import uuid
from sqlalchemy import Column, String, Boolean, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMPTZ
from sqlalchemy.orm import relationship
from app.infrastructure.database.connection import Base


class Employee(Base):
    __tablename__ = "employees"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    employee_code = Column(String(20), unique=True, nullable=False, index=True)
    full_name     = Column(String(100), nullable=False)
    position      = Column(String(100), nullable=True)
    email         = Column(String(255), unique=True, nullable=True, index=True)
    phone         = Column(String(20), nullable=True)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True)
    shift_start_time = Column(String(5), nullable=True)
    shift_end_time   = Column(String(5), nullable=True)
    status       = Column(String(20), nullable=False, default="active", index=True)
    face_encoded = Column(Boolean, nullable=False, default=False)
    photo_path   = Column(Text, nullable=True)
    created_at   = Column(TIMESTAMPTZ, nullable=False, server_default=func.now())
    updated_at   = Column(TIMESTAMPTZ, nullable=True, onupdate=func.now())

    department         = relationship("Department", back_populates="employees")
    face_encodings     = relationship("FaceEncoding", back_populates="employee", cascade="all, delete-orphan")
    attendance_records = relationship("AttendanceRecord", back_populates="employee")
    activity_logs      = relationship("ActivityLog", back_populates="employee")

    def __repr__(self) -> str:
        return f"<Employee {self.employee_code} — {self.full_name}>"
