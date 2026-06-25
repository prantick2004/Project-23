"""
Central import for all ORM models.
Alembic reads this to detect all tables.
"""
from app.infrastructure.database.connection import Base  # noqa: F401
from app.infrastructure.database.models.user import UserModel  # noqa: F401
from app.infrastructure.database.models.department import DepartmentModel  # noqa: F401
from app.infrastructure.database.models.employee import EmployeeModel  # noqa: F401
from app.infrastructure.database.models.face_encoding import FaceEncodingModel  # noqa: F401
from app.infrastructure.database.models.camera import CameraModel  # noqa: F401
from app.infrastructure.database.models.attendance import AttendanceModel  # noqa: F401
from app.infrastructure.database.models.activity import ActivityLogModel  # noqa: F401
from app.infrastructure.database.models.evidence import EvidenceModel  # noqa: F401
from app.infrastructure.database.models.alert import AlertModel  # noqa: F401
from app.infrastructure.database.models.audit import AuditLogModel  # noqa: F401
from app.infrastructure.database.models.settings import SystemSettingModel  # noqa: F401
