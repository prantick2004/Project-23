"""
Celery application instance — background task queue for Project-23.
Broker + result backend: Redis (same instance already used by the app).
Run worker with:
    celery -A app.workers.celery_app worker --loglevel=info
"""
from celery import Celery

from app.core.config import get_settings
import app.infrastructure.database.base  # noqa: F401 — load ALL models so relationships resolve

settings = get_settings()

celery_app = Celery(
    "project23",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.workers.report_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    result_expires=3600,          # task results kept 1 hour
    task_track_started=True,      # lets us report "in progress" not just pending/done
)
