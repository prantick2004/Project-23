"""
app/api/main.py
---------------
FastAPI application entry point for Project-23.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.core.rate_limit import limiter

setup_logging()
logger   = get_logger(__name__)
settings = get_settings()

@asynccontextmanager
async def lifespan(_: FastAPI):
    """Startup: capture the event loop, load AI models, warm the face-encoding
    cache. Shutdown: stop all camera threads cleanly. (Replaces the deprecated
    @app.on_event hooks; behaviour is unchanged.)"""
    import asyncio
    set_main_loop(asyncio.get_running_loop())

    from app.infrastructure.ai.model_registry import model_registry
    model_registry.load()

    async with AsyncSessionFactory() as session:
        service = FaceEncodingService(session)
        count = await service.refresh_cache_from_db()
        logger.info("encoding_cache_ready", total_encodings=count)

    try:
        yield
    finally:
        stream_manager.stop_all()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-Powered Smart Employee Monitoring and Attendance System",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Rate limiting (slowapi). The Limiter alone does nothing — SlowAPIMiddleware
# is what actually enforces the 100/minute default on every route. Stricter
# per-route limits (e.g. /auth/login) are applied with @limiter.limit(...).
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS — explicit allow-list from config. A wildcard origin together with
# allow_credentials=True is insecure (and rejected by browsers), so origins are
# always an explicit list sourced from CORS_ALLOWED_ORIGINS.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics — exposes GET /metrics
Instrumentator().instrument(app).expose(app)

# Media directory still created for local_storage.py writes —
# no longer mounted as public static route (RBAC bypass fix, Phase 12).
# Access is now only via GET /employees/{id}/photo and evidence endpoints.
os.makedirs("media", exist_ok=True)

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


