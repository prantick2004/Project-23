"""
Dashboard Router — read-only aggregated stats for live dashboard UI.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db, get_current_active_user
from app.services.dashboard_service import DashboardService
from app.schemas.dashboard import (
    DashboardStatsResponse,
    DashboardCamerasResponse,
    DashboardLiveAttendanceResponse,
    DashboardRecentAlertsResponse,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    service = DashboardService(db)
    return await service.get_stats()


@router.get("/cameras", response_model=DashboardCamerasResponse)
async def get_dashboard_cameras(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    service = DashboardService(db)
    return await service.get_cameras()


@router.get("/attendance/live", response_model=DashboardLiveAttendanceResponse)
async def get_dashboard_live_attendance(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    service = DashboardService(db)
    return await service.get_live_attendance()


@router.get("/alerts/recent", response_model=DashboardRecentAlertsResponse)
async def get_dashboard_recent_alerts(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    service = DashboardService(db)
    return await service.get_recent_alerts(limit=limit)
