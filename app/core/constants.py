"""
app/core/constants.py
---------------------
All enumerations and constants for Project-23.
Import these everywhere instead of using raw strings.
"""

from enum import Enum


# ─── User Roles ──────────────────────────────────────────────────────────────
class UserRole(str, Enum):
    ADMIN    = "admin"
    OPERATOR = "operator"
    VIEWER   = "viewer"


# ─── Employee Status ─────────────────────────────────────────────────────────
class EmployeeStatus(str, Enum):
    ACTIVE     = "active"
    INACTIVE   = "inactive"
    SUSPENDED  = "suspended"
    TERMINATED = "terminated"


# ─── Camera Types ─────────────────────────────────────────────────────────────
class CameraType(str, Enum):
    USB  = "usb"
    IP   = "ip"
    RTSP = "rtsp"
    CCTV = "cctv"


# ─── Camera Status ────────────────────────────────────────────────────────────
class CameraStatus(str, Enum):
    ONLINE   = "online"
    OFFLINE  = "offline"
    ERROR    = "error"
    DISABLED = "disabled"


# ─── Attendance Status ────────────────────────────────────────────────────────
class AttendanceStatus(str, Enum):
    PRESENT   = "present"
    ABSENT    = "absent"
    LATE      = "late"
    HALF_DAY  = "half_day"
    ON_LEAVE  = "on_leave"


# ─── Activity Types ───────────────────────────────────────────────────────────
class ActivityType(str, Enum):
    MOBILE_PHONE_USAGE         = "mobile_phone_usage"
    SLEEPING                   = "sleeping"
    LONG_INACTIVITY            = "long_inactivity"
    WORKSTATION_ABSENCE        = "workstation_absence"
    UNAUTHORIZED_ACCESS        = "unauthorized_access"
    RESTRICTED_AREA_VIOLATION  = "restricted_area_violation"
    SUSPICIOUS_ACTIVITY        = "suspicious_activity"
    UNKNOWN_PERSON_DETECTED    = "unknown_person_detected"
    CAMERA_FAILURE             = "camera_failure"
    SYSTEM_EVENT               = "system_event"


# ─── Alert Severity ───────────────────────────────────────────────────────────
class AlertSeverity(str, Enum):
    INFO     = "info"
    LOW      = "low"
    MEDIUM   = "medium"
    HIGH     = "high"
    CRITICAL = "critical"


# ─── Report Formats ───────────────────────────────────────────────────────────
class ReportFormat(str, Enum):
    PDF   = "pdf"
    EXCEL = "excel"
    CSV   = "csv"


# ─── Token Types ──────────────────────────────────────────────────────────────
class TokenType(str, Enum):
    ACCESS  = "access"
    REFRESH = "refresh"


# ─── General Constants ────────────────────────────────────────────────────────
class AppConstants:
    API_V1_PREFIX          = "/api/v1"
    DEFAULT_PAGE_SIZE      = 20
    MAX_PAGE_SIZE          = 100
    MIN_FACE_CONFIDENCE    = 0.55
    UNKNOWN_LABEL          = "Unknown"
    FRAME_BUFFER_SIZE      = 30    # frames kept in camera buffer
    VIDEO_CLIP_DURATION    = 10    # seconds to record on event
