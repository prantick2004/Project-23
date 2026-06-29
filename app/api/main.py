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

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve media files
os.makedirs("media", exist_ok=True)
app.mount("/media", StaticFiles(directory="media"), name="media")

# Routers
app.include_router(auth_router,       prefix=AppConstants.API_V1_PREFIX)
app.include_router(employee_router,   prefix=AppConstants.API_V1_PREFIX)
app.include_router(department_router, prefix=AppConstants.API_V1_PREFIX)

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
