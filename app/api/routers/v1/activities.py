"""
Activity Router — read + resolve endpoints for detected activity events.
No write/create endpoints exposed here — activity logs are created only
by the camera recognition/detection loop (stream_manager), same pattern
as attendance in Phase 6.
"""
from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db, get_current_active_user
from app.services.activity_service import ActivityService
from app.core.constants import ActivityType
from app.schemas.activity import (
    ActivityResponse, ActivityListResponse,
    ActivityResolveResponse, ActivityStatsResponse,
)

router = APIRouter(prefix="/activities", tags=["Activities"])


@router.get("/", response_model=ActivityListResponse)
async def list_activities(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    employee_id: Optional[UUID] = Query(None),
    camera_id: Optional[UUID] = Query(None),
    activity_type: Optional[ActivityType] = Query(None),
    is_resolved: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    service = ActivityService(db)
    activities = await service.list_activities(
        skip=skip,
        limit=limit,
        employee_id=str(employee_id) if employee_id else None,
        camera_id=str(camera_id) if camera_id else None,
        activity_type=activity_type,
        is_resolved=is_resolved,
    )
    return ActivityListResponse(total=len(activities), activities=activities)


@router.get("/stats/by-type", response_model=ActivityStatsResponse)
async def get_stats_by_type(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    service = ActivityService(db)
    stats = await service.stats_by_type()
    return ActivityStatsResponse(stats=stats)


@router.get("/{activity_id}", response_model=ActivityResponse)
async def get_activity(
    activity_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    try:
        service = ActivityService(db)
        return await service.get_activity(str(activity_id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put("/{activity_id}/resolve", response_model=ActivityResolveResponse)
async def resolve_activity(
    activity_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    try:
        service = ActivityService(db)
        log = await service.resolve_activity(str(activity_id))
        return ActivityResolveResponse(
            id=str(log.id),
            is_resolved=log.is_resolved,
            resolved_at=log.resolved_at,
            message="Activity marked as resolved",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
