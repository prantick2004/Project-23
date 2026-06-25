"""
app/core/config.py
------------------
Central configuration management for Project-23.
Reads all environment variables from .env file using Pydantic Settings.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    All application settings loaded from environment variables.
    lru_cache ensures this is only created once (singleton pattern).
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ─── Application ─────────────────────────────────────────────
    app_name: str = "Project-23"
    app_version: str = "1.0.0"
    debug: bool = False
    secret_key: str
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # ─── Database ────────────────────────────────────────────────
    database_host: str = "localhost"
    database_port: int = 5432
    database_name: str = "project23_db"
    database_user: str = "project23_user"
    database_password: str = "project23_pass"
    database_url: str

    # ─── Redis ───────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"

    # ─── Storage ─────────────────────────────────────────────────
    storage_path: str = "./storage"
    max_upload_size_mb: int = 10

    # ─── Face Recognition ────────────────────────────────────────
    face_recognition_tolerance: float = 0.55
    face_recognition_model: str = "hog"
    encoding_cache_size: int = 1000

    # ─── Attendance ──────────────────────────────────────────────
    late_threshold_minutes: int = 15
    attendance_cooldown_minutes: int = 5

    # ─── Alerts ──────────────────────────────────────────────────
    email_enabled: bool = False
    sms_enabled: bool = False
    email_host: str = "smtp.gmail.com"
    email_port: int = 587
    email_username: str = ""
    email_password: str = ""

    # ─── Evidence ────────────────────────────────────────────────
    evidence_retention_days: int = 90

    @property
    def max_upload_size_bytes(self) -> int:
        """Convert MB to bytes for validation."""
        return self.max_upload_size_mb * 1024 * 1024


@lru_cache()
def get_settings() -> Settings:
    """
    Returns cached Settings instance.
    Use this function everywhere in the app:
        from app.core.config import get_settings
        settings = get_settings()
    """
    return Settings()
