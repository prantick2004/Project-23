"""
Employee Router — async API endpoints for employee management.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db, require_admin, require_operator
from app.services.employee_service import EmployeeService
from app.schemas.employee import (
    EmployeeCreate, EmployeeUpdate,
    EmployeeResponse, EmployeeListResponse,
    EmployeeEncodeResponse
)
from app.services.face_encoding_service import FaceEncodingService

router = APIRouter(prefix="/employees", tags=["Employees"])


@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(
    payload: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Create new employee. Admin only."""
    try:
        service = EmployeeService(db)
        return await service.create_employee(payload.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=EmployeeListResponse)
async def list_employees(
    skip:  int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_operator),
):
    """Get paginated list of all employees. Operator or admin."""
    service   = EmployeeService(db)
    employees = await service.get_all_employees(skip=skip, limit=limit)
    return EmployeeListResponse(total=len(employees), employees=employees)


@router.get("/active", response_model=list[EmployeeResponse])
async def list_active_employees(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_operator),
):
    """Get all active employees. Operator or admin."""
    service = EmployeeService(db)
    return await service.get_active_employees()


@router.get("/search", response_model=list[EmployeeResponse])
async def search_employees(
    name: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_operator),
):
    """Search employees by name. Operator or admin."""
    service = EmployeeService(db)
    return await service.search_employees(name)


@router.get("/{employee_id}", response_model=EmployeeResponse)
async def get_employee(
    employee_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_operator),
):
    """Get single employee by ID. Operator or admin."""
    try:
        service = EmployeeService(db)
        return await service.get_employee(str(employee_id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put("/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: UUID,
    payload: EmployeeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Update employee details. Admin only."""
    try:
        service = EmployeeService(db)
        return await service.update_employee(
            str(employee_id),
            payload.model_dump(exclude_unset=True)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(
    employee_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Delete employee permanently. Admin only."""
    try:
        service = EmployeeService(db)
        await service.delete_employee(str(employee_id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{employee_id}/photo", response_model=EmployeeResponse)
async def upload_photo(
    employee_id: UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Upload employee photo. Admin only."""
    try:
        service = EmployeeService(db)
        return await service.upload_photo(str(employee_id), file)
    except (ValueError, RuntimeError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{employee_id}/encode", response_model=EmployeeEncodeResponse)
async def encode_employee_face(
    employee_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Generate face encoding from employee's stored photo. Admin only."""
    try:
        service = FaceEncodingService(db)
        return await service.encode_employee(str(employee_id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{employee_id}/photo")
async def get_employee_photo(
    employee_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_operator),
):
    """Serve employee photo file. Operator or admin only."""
    try:
        service = EmployeeService(db)
        employee = await service.get_employee(str(employee_id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    if not employee.photo_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No photo uploaded for this employee")
    return FileResponse(employee.photo_path, media_type="image/jpeg")
