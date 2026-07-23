"""
Pydantic schemas for Alert API requests/responses.
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.core.constants import AlertSeverity


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    activity_log_id: Optional[UUID] = None
    alert_type: str
    severity: AlertSeverity
    title: str
    message: str
    is_acknowledged: bool
    acknowledged_by: Optional[UUID] = None
    acknowledged_at: Optional[datetime] = None
    channels_sent: Optional[dict] = None
    created_at: datetime


class AlertListResponse(BaseModel):
    total: int
    alerts: List[AlertResponse]


class AlertAcknowledgeResponse(BaseModel):
    id: str
    is_acknowledged: bool
    acknowledged_at: Optional[datetime] = None
    message: str


class AlertUnreadCountResponse(BaseModel):
    unread_count: int
