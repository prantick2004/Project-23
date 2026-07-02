"""
Central import for all ORM models.
Alembic reads this to detect all tables.
"""
from app.infrastructure.database.connection import Base  # noqa: F401
from app.infrastructure.database.models.user import UserModel  # noqa: F401
from app.infrastructure.database.models.department import Department  # noqa: F401
from app.infrastructure.database.models.employee import Employee  # noqa: F401
from app.infrastructure.database.models.face_encoding import FaceEncoding  # noqa: F401
from app.infrastructure.database.models.camera import Camera  # noqa: F401
from app.infrastructure.database.models.attendance import AttendanceRecord  # noqa: F401
from app.infrastructure.database.models.activity import ActivityLog  # noqa: F401
from app.infrastructure.database.models.evidence import Evidence  # noqa: F401
from app.infrastructure.database.models.alert import Alert  # noqa: F401
from app.infrastructure.database.models.audit import AuditLogModel  # noqa: F401
from app.infrastructure.database.models.settings import SystemSettingModel  # noqa: F401
