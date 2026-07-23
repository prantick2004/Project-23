"""
Pydantic schemas for Evidence API responses.
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class EvidenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    activity_log_id: UUID
    camera_id: UUID
    employee_id: Optional[UUID] = None
    screenshot_path: Optional[str] = None
    video_clip_path: Optional[str] = None
    thumbnail_path: Optional[str] = None
    file_size_bytes: int
    duration_seconds: Optional[int] = None
    captured_at: datetime
    is_archived: bool


class EvidenceListResponse(BaseModel):
    total: int
    evidence: List[EvidenceResponse]
