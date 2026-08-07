"""
Employee Pydantic schemas — request/response validation.
"""
import re
from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator


# ------------------------------------------------------------------ #
#  REQUEST SCHEMAS
# ------------------------------------------------------------------ #
class EmployeeCreate(BaseModel):
    """Schema for creating new employee."""
    employee_code:    str
    full_name:        str
    position:         Optional[str] = None
    email:            Optional[EmailStr] = None
    phone:            Optional[str] = None
    department_id:    Optional[UUID] = None
    shift_start_time: Optional[str] = None
    shift_end_time:   Optional[str] = None
    status:           Optional[str] = "active"

    @field_validator("employee_code")
    @classmethod
    def validate_employee_code(cls, v: str) -> str:
        """
        Restrict to a safe, filesystem-path-safe character set.
        employee_code is used to build photo storage filenames
        (LocalStorageService.save_employee_photo) -- without this
        check, a value like '../../etc/whatever' would be usable
        as a path-traversal payload once written to disk.
        """
        v = v.strip().upper()
        if not (2 <= len(v) <= 20):
            raise ValueError("employee_code must be 2-20 characters")
        if not re.match(r'^[A-Z0-9\-_]+$', v):
            raise ValueError("employee_code may only contain letters, digits, dash, underscore")
        return v


class EmployeeUpdate(BaseModel):
    """Schema for updating employee — all fields optional."""
    full_name:        Optional[str] = None
    position:         Optional[str] = None
    email:            Optional[EmailStr] = None
    phone:            Optional[str] = None
    department_id:    Optional[UUID] = None
    shift_start_time: Optional[str] = None
    shift_end_time:   Optional[str] = None
    status:           Optional[str] = None


# ------------------------------------------------------------------ #
#  RESPONSE SCHEMAS
# ------------------------------------------------------------------ #
class EmployeeResponse(BaseModel):
    """Schema for employee response."""
    id:               UUID
    employee_code:    str
    full_name:        str
    position:         Optional[str]
    email:            Optional[str]
    phone:            Optional[str]
    department_id:    Optional[UUID]
    shift_start_time: Optional[str]
    shift_end_time:   Optional[str]
    status:           str
    face_encoded:     bool
    photo_path:       Optional[str]
    created_at:       datetime

    class Config:
        from_attributes = True


class EmployeeListResponse(BaseModel):
    """Schema for paginated employee list."""
    total:     int
    employees: list[EmployeeResponse]


class EmployeeEncodeResponse(BaseModel):
    """Schema for face-encoding generation response."""
    employee_id:   str
    face_encoded:  bool
    quality_score: float
    message:       str
