"""
FaceEncoding ORM model.
"""
import uuid
from datetime import datetime
from sqlalchemy import Boolean, DateTime, Float, String, ForeignKey, LargeBinary
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.infrastructure.database.connection import Base

class FaceEncodingModel(Base):
    __tablename__ = "face_encodings"
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("employees.id", ondelete="CASCADE"), nullable=False
    )
    encoding_vector: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    image_path: Mapped[str] = mapped_column(String(512), nullable=True)
    quality_score: Mapped[float] = mapped_column(Float, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    employee: Mapped["EmployeeModel"] = relationship(
        "EmployeeModel", back_populates="face_encodings"
    )
    def __repr__(self) -> str:
        return f"<FaceEncoding employee={self.employee_id}>"
