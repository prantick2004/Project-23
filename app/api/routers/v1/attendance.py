"""
Attendance Router — read endpoints + manual admin override.
Check-in/check-out are automatic (triggered from recognition loop),
not exposed as write endpoints here.
"""
from uuid import UUID
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db, get_current_active_user
from app.services.attendance_service import AttendanceService
from app.schemas.attendance import (
    AttendanceResponse, AttendanceListResponse, AttendanceOverrideRequest,
)

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.get("/", response_model=AttendanceListResponse)
async def list_attendance(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    service = AttendanceService(db)
    records = await service.get_all(skip=skip, limit=limit)
    return AttendanceListResponse(total=len(records), records=records)


@router.get("/today", response_model=AttendanceListResponse)
async def get_today_attendance(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    service = AttendanceService(db)
    records = await service.get_today(skip=skip, limit=limit)
    return AttendanceListResponse(total=len(records), records=records)


@router.get("/date/{work_date}", response_model=AttendanceListResponse)
async def get_attendance_by_date(
    work_date: date,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    service = AttendanceService(db)
    records = await service.get_by_date(work_date, skip=skip, limit=limit)
    return AttendanceListResponse(total=len(records), records=records)


@router.get("/employee/{employee_id}", response_model=AttendanceListResponse)
async def get_attendance_by_employee(
    employee_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    service = AttendanceService(db)
    records = await service.get_by_employee(employee_id, skip=skip, limit=limit)
    return AttendanceListResponse(total=len(records), records=records)


@router.get("/{attendance_id}", response_model=AttendanceResponse)
async def get_attendance(
    attendance_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    try:
        service = AttendanceService(db)
        return await service.get_by_id(attendance_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put("/{attendance_id}", response_model=AttendanceResponse)
async def override_attendance(
    attendance_id: UUID,
    payload: AttendanceOverrideRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Manual admin override of a record (status, times, reason)."""
    try:
        service = AttendanceService(db)
        return await service.manual_override(
            attendance_id=attendance_id,
            status_value=payload.status,
            check_in_time=payload.check_in_time,
            check_out_time=payload.check_out_time,
            reason=payload.reason,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
