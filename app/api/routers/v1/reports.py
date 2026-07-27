"""
Report Router — Phase 9 Step B: async via Celery.
POST endpoints enqueue a background job and return a job_id immediately.
GET /jobs/{job_id} polls Celery task status/result.
GET /download/{filename} streams the finished file once ready.
"""
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db, get_current_active_user
from app.schemas.report import (
    AttendanceReportRequest, ActivityReportRequest, IncidentReportRequest,
    ReportJobResponse, ReportJobStatusResponse,
)
from app.workers.celery_app import celery_app
from app.workers.report_tasks import (
    generate_attendance_report_task, generate_activity_report_task, generate_incident_report_task,
)

router = APIRouter(prefix="/reports", tags=["Reports"])

REPORTS_DIR = Path("media") / "reports"
_FMT_MAP = {"pdf": "pdf", "excel": "excel", "csv": "csv"}


@router.post("/attendance", response_model=ReportJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def enqueue_attendance_report(
    data: AttendanceReportRequest,
    current_user=Depends(get_current_active_user),
):
    task = generate_attendance_report_task.delay(
        date_from=data.date_from.isoformat(),
        date_to=data.date_to.isoformat(),
        fmt=_FMT_MAP[data.format.value],
        department_id=str(data.department_id) if data.department_id else None,
        employee_id=str(data.employee_id) if data.employee_id else None,
    )
    return ReportJobResponse(job_id=task.id, status="queued")


@router.post("/activity", response_model=ReportJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def enqueue_activity_report(
    data: ActivityReportRequest,
    current_user=Depends(get_current_active_user),
):
    task = generate_activity_report_task.delay(
        date_from=data.date_from.isoformat(),
        date_to=data.date_to.isoformat(),
        fmt=_FMT_MAP[data.format.value],
        activity_type=data.activity_type.value if data.activity_type else None,
        employee_id=str(data.employee_id) if data.employee_id else None,
        camera_id=str(data.camera_id) if data.camera_id else None,
    )
    return ReportJobResponse(job_id=task.id, status="queued")


@router.post("/incidents", response_model=ReportJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def enqueue_incident_report(
    data: IncidentReportRequest,
    current_user=Depends(get_current_active_user),
):
    task = generate_incident_report_task.delay(
        date_from=data.date_from.isoformat(),
        date_to=data.date_to.isoformat(),
        fmt=_FMT_MAP[data.format.value],
    )
    return ReportJobResponse(job_id=task.id, status="queued")


@router.get("/jobs/{job_id}", response_model=ReportJobStatusResponse)
async def get_report_job_status(
    job_id: str,
    current_user=Depends(get_current_active_user),
):
    """Poll Celery task state. status: queued|started|success|failure."""
    result = celery_app.AsyncResult(job_id)

    response = ReportJobStatusResponse(job_id=job_id, status=result.status.lower())

    if result.status == "SUCCESS":
        data = result.result
        response.filename = data["filename"]
        response.row_count = data["row_count"]
        response.download_url = f"/api/v1/reports/download/{data['filename']}"
    elif result.status == "FAILURE":
        response.error = str(result.result)

    return response


@router.get("/download/{filename}")
async def download_report(
    filename: str,
    current_user=Depends(get_current_active_user),
):
    """Serve a previously generated report file."""
    safe_name = Path(filename).name
    file_path = REPORTS_DIR / safe_name
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report file not found")

    media_types = {
        ".csv": "text/csv",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".pdf": "application/pdf",
    }
    media_type = media_types.get(file_path.suffix.lower(), "application/octet-stream")
    return FileResponse(str(file_path), media_type=media_type, filename=safe_name)
