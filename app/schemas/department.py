"""
Department Pydantic schemas — request/response validation.
"""
from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


# ------------------------------------------------------------------ #
#  REQUEST SCHEMAS
# ------------------------------------------------------------------ #
class DepartmentCreate(BaseModel):
    """Schema for creating new department."""
    name:        str
    description: Optional[str] = None
    is_active:   Optional[bool] = True


class DepartmentUpdate(BaseModel):
    """Schema for updating department — all fields optional."""
    name:        Optional[str] = None
    description: Optional[str] = None
    is_active:   Optional[bool] = None


# ------------------------------------------------------------------ #
#  RESPONSE SCHEMAS
# ------------------------------------------------------------------ #
class DepartmentResponse(BaseModel):
    """Schema for department response."""
    id:          UUID
    name:        str
    description: Optional[str]
    is_active:   bool
    created_at:  datetime

    class Config:
        from_attributes = True


class DepartmentListResponse(BaseModel):
    """Schema for department list."""
    total:       int
    departments: list[DepartmentResponse]
