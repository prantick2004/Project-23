"""
Employee Router — async API endpoints for employee management.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db, get_current_active_user
from app.services.employee_service import EmployeeService
from app.schemas.employee import (
    EmployeeCreate, EmployeeUpdate,
    EmployeeResponse, EmployeeListResponse
)

router = APIRouter(prefix="/employees", tags=["Employees"])


@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(
    payload: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Create new employee."""
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
    current_user=Depends(get_current_active_user),
):
    """Get paginated list of all employees."""
    service   = EmployeeService(db)
    employees = await service.get_all_employees(skip=skip, limit=limit)
    return EmployeeListResponse(total=len(employees), employees=employees)


@router.get("/active", response_model=list[EmployeeResponse])
async def list_active_employees(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Get all active employees."""
    service = EmployeeService(db)
    return await service.get_active_employees()


@router.get("/search", response_model=list[EmployeeResponse])
async def search_employees(
    name: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Search employees by name."""
    service = EmployeeService(db)
    return await service.search_employees(name)


@router.get("/{employee_id}", response_model=EmployeeResponse)
async def get_employee(
    employee_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Get single employee by ID."""
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
    current_user=Depends(get_current_active_user),
):
    """Update employee details."""
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
    current_user=Depends(get_current_active_user),
):
    """Delete employee permanently."""
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
    current_user=Depends(get_current_active_user),
):
    """Upload employee photo."""
    try:
        service = EmployeeService(db)
        return await service.upload_photo(str(employee_id), file)
    except (ValueError, RuntimeError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
