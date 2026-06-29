"""
Employee Pydantic schemas — request/response validation.
"""
from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr


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
