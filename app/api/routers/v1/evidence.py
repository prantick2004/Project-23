"""
Evidence Router — read-only endpoints. Evidence rows are created only by
the detection pipeline (stream_manager), same pattern as activities.
"""
from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_db, require_operator
from app.services.evidence_service import EvidenceService
from app.schemas.evidence import EvidenceResponse, EvidenceListResponse
router = APIRouter(prefix="/evidence", tags=["Evidence"])
@router.get("/", response_model=EvidenceListResponse)
async def list_evidence(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    employee_id: Optional[UUID] = Query(None),
    camera_id: Optional[UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_operator),
):
    service = EvidenceService(db)
    records = await service.list_evidence(
        skip=skip,
        limit=limit,
        employee_id=str(employee_id) if employee_id else None,
        camera_id=str(camera_id) if camera_id else None,
    )
    return EvidenceListResponse(total=len(records), evidence=records)
@router.get("/{evidence_id}", response_model=EvidenceResponse)
async def get_evidence(
    evidence_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_operator),
):
    try:
        service = EvidenceService(db)
        return await service.get_evidence(str(evidence_id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
@router.get("/{evidence_id}/screenshot")
async def get_evidence_screenshot(
    evidence_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_operator),
):
    """Serve the raw screenshot JPEG file for an evidence record."""
    try:
        service = EvidenceService(db)
        evidence = await service.get_evidence(str(evidence_id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    if not evidence.screenshot_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No screenshot for this evidence record")
    return FileResponse(evidence.screenshot_path, media_type="image/jpeg")
