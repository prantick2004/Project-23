"""
Celery tasks for report generation — wraps the existing async ReportService.
Each task opens its own asyncio event loop (asyncio.run) and its own DB
session, since this runs in a separate Celery worker process, not the
FastAPI event loop.

IMPORTANT: Celery prefork workers reuse the same child process (and thus
the same global SQLAlchemy async engine / asyncpg connection pool) across
multiple tasks. asyncpg connections are bound to the event loop that
created them, so a second task's new event loop cannot reuse a connection
opened by the first task's loop. Fix: dispose the engine's pool at the
start of every task so fresh connections are made in the current loop.
Safe to do here — this is a separate process from the FastAPI/uvicorn
process, so it never touches the API server's own engine/pool.
"""
from datetime import date, datetime, time
from typing import Optional

from app.workers.celery_app import celery_app
from app.infrastructure.database.connection import AsyncSessionFactory, engine
from app.services.report_service import ReportService
from app.core.constants import ActivityType


async def _run_attendance_report(
    date_from: str, date_to: str, fmt: str,
    department_id: Optional[str], employee_id: Optional[str],
) -> dict:
    await engine.dispose()
    async with AsyncSessionFactory() as session:
        service = ReportService(session)
        result = await service.generate_attendance_report(
            date_from=date.fromisoformat(date_from),
            date_to=date.fromisoformat(date_to),
            fmt=fmt,
            department_id=department_id,
            employee_id=employee_id,
        )
        result["generated_at"] = result["generated_at"].isoformat()
        return result


async def _run_activity_report(
    date_from: str, date_to: str, fmt: str,
    activity_type: Optional[str], employee_id: Optional[str], camera_id: Optional[str],
) -> dict:
    await engine.dispose()
    async with AsyncSessionFactory() as session:
        service = ReportService(session)
        dt_from = datetime.combine(date.fromisoformat(date_from), time.min)
        dt_to = datetime.combine(date.fromisoformat(date_to), time.max)
        result = await service.generate_activity_report(
            date_from=dt_from, date_to=dt_to, fmt=fmt,
            activity_type=ActivityType(activity_type) if activity_type else None,
            employee_id=employee_id, camera_id=camera_id,
        )
        result["generated_at"] = result["generated_at"].isoformat()
        return result


async def _run_incident_report(date_from: str, date_to: str, fmt: str) -> dict:
    await engine.dispose()
    async with AsyncSessionFactory() as session:
        service = ReportService(session)
        dt_from = datetime.combine(date.fromisoformat(date_from), time.min)
        dt_to = datetime.combine(date.fromisoformat(date_to), time.max)
        result = await service.generate_incident_report(date_from=dt_from, date_to=dt_to, fmt=fmt)
        result["generated_at"] = result["generated_at"].isoformat()
        return result


@celery_app.task(name="reports.generate_attendance", bind=True)
def generate_attendance_report_task(
    self, date_from: str, date_to: str, fmt: str,
    department_id: Optional[str] = None, employee_id: Optional[str] = None,
) -> dict:
    import asyncio
    return asyncio.run(_run_attendance_report(date_from, date_to, fmt, department_id, employee_id))


@celery_app.task(name="reports.generate_activity", bind=True)
def generate_activity_report_task(
    self, date_from: str, date_to: str, fmt: str,
    activity_type: Optional[str] = None, employee_id: Optional[str] = None, camera_id: Optional[str] = None,
) -> dict:
    import asyncio
    return asyncio.run(_run_activity_report(date_from, date_to, fmt, activity_type, employee_id, camera_id))


@celery_app.task(name="reports.generate_incident", bind=True)
def generate_incident_report_task(self, date_from: str, date_to: str, fmt: str) -> dict:
    import asyncio
    return asyncio.run(_run_incident_report(date_from, date_to, fmt))
