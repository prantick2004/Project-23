"""
app/api/main.py
---------------
FastAPI application entry point for Project-23.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import get_settings
from app.core.logging import setup_logging, get_logger
from app.core.constants import AppConstants
import app.infrastructure.database.base  # noqa: F401 — load all models
from app.api.routers.v1.auth import router as auth_router
from app.api.routers.v1.employees import router as employee_router
from app.api.routers.v1.departments import router as department_router
from app.api.routers.v1.cameras import router as camera_router
from app.api.routers.v1.attendance import router as attendance_router
from app.api.routers.v1.activities import router as activity_router
from app.api.routers.v1.evidence import router as evidence_router
from app.api.routers.v1.alerts import router as alert_router
from app.api.routers.v1.reports import router as report_router
from app.api.routers.v1.dashboard import router as dashboard_router
from app.api.websockets.camera_stream import router as camera_stream_router
from app.api.websockets.alert_stream import router as alert_stream_router
from app.api.websockets.attendance_stream import router as attendance_stream_router
from app.infrastructure.camera.stream_manager import stream_manager
from app.infrastructure.camera.main_loop import set_main_loop
from app.infrastructure.database.connection import AsyncSessionFactory
from app.services.face_encoding_service import FaceEncodingService
from prometheus_fastapi_instrumentator import Instrumentator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

setup_logging()
logger   = get_logger(__name__)
settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-Powered Smart Employee Monitoring and Attendance System",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Rate limiting (slowapi) — default limit applied via decorator per-route if needed;
# global default here protects every route at 100 requests/minute per client IP.
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics — exposes GET /metrics
Instrumentator().instrument(app).expose(app)

# Serve media files
os.makedirs("media", exist_ok=True)
app.mount("/media", StaticFiles(directory="media"), name="media")

# Routers
app.include_router(auth_router,       prefix=AppConstants.API_V1_PREFIX)
app.include_router(employee_router,   prefix=AppConstants.API_V1_PREFIX)
app.include_router(department_router, prefix=AppConstants.API_V1_PREFIX)
app.include_router(camera_router,      prefix=AppConstants.API_V1_PREFIX)
app.include_router(attendance_router,  prefix=AppConstants.API_V1_PREFIX)
app.include_router(activity_router,    prefix=AppConstants.API_V1_PREFIX)
app.include_router(evidence_router,    prefix=AppConstants.API_V1_PREFIX)
app.include_router(alert_router,       prefix=AppConstants.API_V1_PREFIX)
app.include_router(report_router,      prefix=AppConstants.API_V1_PREFIX)
app.include_router(dashboard_router,   prefix=AppConstants.API_V1_PREFIX)
app.include_router(camera_stream_router)
app.include_router(alert_stream_router)
app.include_router(attendance_stream_router)

@app.get("/")
async def root():
    return {
        "project": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "docs":    "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.on_event("startup")
async def startup_event() -> None:
    """Load AI models, warm the face-encoding cache from DB, capture main event loop."""
    import asyncio
    set_main_loop(asyncio.get_running_loop())

    from app.infrastructure.ai.model_registry import model_registry
    model_registry.load()

    async with AsyncSessionFactory() as session:
        service = FaceEncodingService(session)
        count = await service.refresh_cache_from_db()
        logger.info("encoding_cache_ready", total_encodings=count)


@app.on_event("shutdown")
async def shutdown_event() -> None:
    """Stop all running camera threads cleanly when the server shuts down."""
    stream_manager.stop_all()
