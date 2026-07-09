"""
Camera Router — async API endpoints for camera management + stream control.
"""
from uuid import UUID
import cv2

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db, get_current_active_user
from app.services.camera_service import CameraService
from app.infrastructure.camera.stream_manager import stream_manager
from app.schemas.camera import (
    CameraCreate, CameraUpdate,
    CameraResponse, CameraListResponse,
    CameraStreamActionResponse, CameraStatusResponse,
)

router = APIRouter(prefix="/cameras", tags=["Cameras"])


@router.post("/", response_model=CameraResponse, status_code=status.HTTP_201_CREATED)
async def create_camera(
    payload: CameraCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    try:
        service = CameraService(db)
        return await service.create_camera(payload.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=CameraListResponse)
async def list_cameras(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    service = CameraService(db)
    cameras = await service.get_all_cameras(skip=skip, limit=limit)
    return CameraListResponse(total=len(cameras), cameras=cameras)


@router.get("/{camera_id}", response_model=CameraResponse)
async def get_camera(
    camera_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    try:
        service = CameraService(db)
        return await service.get_camera(str(camera_id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put("/{camera_id}", response_model=CameraResponse)
async def update_camera(
    camera_id: UUID,
    payload: CameraUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    try:
        service = CameraService(db)
        return await service.update_camera(str(camera_id), payload.model_dump(exclude_unset=True))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/{camera_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_camera(
    camera_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    try:
        service = CameraService(db)
        await service.delete_camera(str(camera_id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{camera_id}/start", response_model=CameraStreamActionResponse)
async def start_camera_stream(
    camera_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    try:
        service = CameraService(db)
        return await service.start_stream(str(camera_id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{camera_id}/stop", response_model=CameraStreamActionResponse)
async def stop_camera_stream(
    camera_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    try:
        service = CameraService(db)
        return await service.stop_stream(str(camera_id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/{camera_id}/status", response_model=CameraStatusResponse)
async def get_camera_status(
    camera_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    try:
        service = CameraService(db)
        return await service.get_status(str(camera_id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/{camera_id}/snapshot")
async def get_camera_snapshot(
    camera_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Returns a single current JPEG frame from the running camera stream."""
    service = CameraService(db)
    frame = service.get_snapshot_frame(str(camera_id))

    if frame is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No frame available. Is the camera stream started?",
        )

    success, buffer = cv2.imencode(".jpg", frame)
    if not success:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Frame encoding failed")

    return Response(content=buffer.tobytes(), media_type="image/jpeg")


@router.get("/{camera_id}/recognitions")
async def get_camera_recognitions(
    camera_id: UUID,
    current_user=Depends(get_current_active_user),
):
    """
    Returns the most recent face recognition results for this camera
    (recomputed roughly every ~3 frames/sec inside the camera thread).
    Each entry: box, employee_id (or null if unknown), confidence, is_match.
    """
    results = stream_manager.get_recognitions(str(camera_id))
    return {
        "camera_id": str(camera_id),
        "faces_detected": len(results),
        "recognitions": results,
    }
