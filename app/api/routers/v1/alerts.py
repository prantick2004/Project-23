"""
Alert Router — list, detail, acknowledge, unread-count.
Alerts are created only by the detection pipeline (stream_manager).
"""
from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db, get_current_active_user
from app.services.alert_service import AlertService
from app.core.constants import AlertSeverity
from app.schemas.alert import (
    AlertResponse, AlertListResponse,
    AlertAcknowledgeResponse, AlertUnreadCountResponse,
)

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/", response_model=AlertListResponse)
async def list_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    severity: Optional[AlertSeverity] = Query(None),
    is_acknowledged: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    service = AlertService(db)
    alerts = await service.list_alerts(
        skip=skip, limit=limit, severity=severity, is_acknowledged=is_acknowledged
    )
    return AlertListResponse(total=len(alerts), alerts=alerts)


@router.get("/unread-count", response_model=AlertUnreadCountResponse)
async def unread_count(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    service = AlertService(db)
    count = await service.unread_count()
    return AlertUnreadCountResponse(unread_count=count)


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    try:
        service = AlertService(db)
        return await service.get_alert(str(alert_id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put("/{alert_id}/acknowledge", response_model=AlertAcknowledgeResponse)
async def acknowledge_alert(
    alert_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    try:
        service = AlertService(db)
        alert = await service.acknowledge_alert(str(alert_id), user_id=current_user.id)
        return AlertAcknowledgeResponse(
            id=str(alert.id),
            is_acknowledged=alert.is_acknowledged,
            acknowledged_at=alert.acknowledged_at,
            message="Alert acknowledged",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
