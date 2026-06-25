"""
app/core/exceptions.py
----------------------
Custom exception classes for Project-23.
These give us clean, specific error messages instead of generic crashes.
"""


# ─── Base Exception ───────────────────────────────────────────────────────────
class Project23Exception(Exception):
    """Base exception for all Project-23 errors."""
    def __init__(self, message: str, code: str = "UNKNOWN_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


# ─── Authentication Exceptions ────────────────────────────────────────────────
class AuthenticationError(Project23Exception):
    """Raised when login credentials are invalid."""
    def __init__(self, message: str = "Invalid credentials"):
        super().__init__(message, "AUTH_ERROR")


class TokenExpiredError(Project23Exception):
    """Raised when JWT token has expired."""
    def __init__(self, message: str = "Token has expired"):
        super().__init__(message, "TOKEN_EXPIRED")


class InsufficientPermissionsError(Project23Exception):
    """Raised when user doesn't have required role."""
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(message, "PERMISSION_DENIED")


# ─── Employee Exceptions ──────────────────────────────────────────────────────
class EmployeeNotFoundError(Project23Exception):
    """Raised when employee ID doesn't exist in database."""
    def __init__(self, employee_id: str = ""):
        super().__init__(
            f"Employee not found: {employee_id}",
            "EMPLOYEE_NOT_FOUND"
        )


class EmployeeAlreadyExistsError(Project23Exception):
    """Raised when trying to register duplicate employee code or email."""
    def __init__(self, field: str = "employee"):
        super().__init__(
            f"Employee already exists with this {field}",
            "EMPLOYEE_EXISTS"
        )


class FaceEncodingError(Project23Exception):
    """Raised when face encoding generation fails."""
    def __init__(self, message: str = "Failed to generate face encoding"):
        super().__init__(message, "ENCODING_ERROR")


# ─── Camera Exceptions ────────────────────────────────────────────────────────
class CameraNotFoundError(Project23Exception):
    """Raised when camera ID doesn't exist."""
    def __init__(self, camera_id: str = ""):
        super().__init__(
            f"Camera not found: {camera_id}",
            "CAMERA_NOT_FOUND"
        )


class CameraConnectionError(Project23Exception):
    """Raised when camera stream cannot be opened."""
    def __init__(self, message: str = "Cannot connect to camera"):
        super().__init__(message, "CAMERA_CONNECTION_ERROR")


class CameraAlreadyRunningError(Project23Exception):
    """Raised when trying to start an already running camera."""
    def __init__(self, camera_id: str = ""):
        super().__init__(
            f"Camera is already running: {camera_id}",
            "CAMERA_ALREADY_RUNNING"
        )


# ─── Attendance Exceptions ────────────────────────────────────────────────────
class AttendanceRecordNotFoundError(Project23Exception):
    """Raised when attendance record doesn't exist."""
    def __init__(self, message: str = "Attendance record not found"):
        super().__init__(message, "ATTENDANCE_NOT_FOUND")


class DuplicateAttendanceError(Project23Exception):
    """Raised when check-in already exists for today."""
    def __init__(self, employee_id: str = ""):
        super().__init__(
            f"Attendance already recorded today for: {employee_id}",
            "DUPLICATE_ATTENDANCE"
        )


# ─── Storage Exceptions ───────────────────────────────────────────────────────
class FileUploadError(Project23Exception):
    """Raised when file upload fails."""
    def __init__(self, message: str = "File upload failed"):
        super().__init__(message, "UPLOAD_ERROR")


class FileSizeTooLargeError(Project23Exception):
    """Raised when uploaded file exceeds size limit."""
    def __init__(self, max_mb: int = 10):
        super().__init__(
            f"File size exceeds maximum allowed size of {max_mb}MB",
            "FILE_TOO_LARGE"
        )


# ─── Database Exceptions ──────────────────────────────────────────────────────
class DatabaseError(Project23Exception):
    """Raised when a database operation fails."""
    def __init__(self, message: str = "Database operation failed"):
        super().__init__(message, "DATABASE_ERROR")


# ─── Report Exceptions ────────────────────────────────────────────────────────
class ReportGenerationError(Project23Exception):
    """Raised when report generation fails."""
    def __init__(self, message: str = "Report generation failed"):
        super().__init__(message, "REPORT_ERROR")
