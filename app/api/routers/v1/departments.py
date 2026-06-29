"""
Department Router — async API endpoints for department management.
"""
import uuid
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db, get_current_active_user
from app.repositories.department_repository import DepartmentRepository
from app.infrastructure.database.models.department import Department
from app.schemas.department import (
    DepartmentCreate, DepartmentUpdate,
    DepartmentResponse, DepartmentListResponse
)

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.post("/", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_department(
    payload: DepartmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Create new department."""
    repo = DepartmentRepository(db)
    if await repo.get_by_name(payload.name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Department '{payload.name}' already exists"
        )
    dept = Department(
        id          = uuid.uuid4(),
        name        = payload.name,
        description = payload.description,
        is_active   = payload.is_active,
    )
    return await repo.create(dept)


@router.get("/", response_model=DepartmentListResponse)
async def list_departments(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Get all departments."""
    repo  = DepartmentRepository(db)
    depts = await repo.get_all()
    return DepartmentListResponse(total=len(depts), departments=depts)


@router.get("/active", response_model=list[DepartmentResponse])
async def list_active_departments(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Get all active departments."""
    repo = DepartmentRepository(db)
    return await repo.get_active_departments()


@router.get("/{department_id}", response_model=DepartmentResponse)
async def get_department(
    department_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Get single department by ID."""
    repo = DepartmentRepository(db)
    dept = await repo.get_by_id(str(department_id))
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )
    return dept


@router.put("/{department_id}", response_model=DepartmentResponse)
async def update_department(
    department_id: UUID,
    payload: DepartmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Update department details."""
    repo = DepartmentRepository(db)
    dept = await repo.get_by_id(str(department_id))
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(dept, field, value)
    return await repo.update(dept)


@router.delete("/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_department(
    department_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Soft delete — deactivate department."""
    repo = DepartmentRepository(db)
    dept = await repo.deactivate(str(department_id))
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )
