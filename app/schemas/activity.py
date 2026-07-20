"""
Activity Pydantic schemas — request/response validation.
"""
from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class ActivityResponse(BaseModel):
    id: UUID
    employee_id: Optional[UUID]
    camera_id: UUID
    activity_type: str
    description: Optional[str]
    confidence_score: Optional[float]
    bounding_box: Optional[dict]
    duration_seconds: Optional[int]
    is_resolved: bool
    resolved_at: Optional[datetime]
    detected_at: datetime

    class Config:
        from_attributes = True


class ActivityListResponse(BaseModel):
    total: int
    activities: list[ActivityResponse]


class ActivityResolveResponse(BaseModel):
    id: str
    is_resolved: bool
    resolved_at: Optional[datetime]
    message: str


class ActivityStatsResponse(BaseModel):
    stats: list[dict]
