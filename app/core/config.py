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

    # Comma-separated list of browser origins allowed to make credentialed
    # requests. "*" is intentionally NOT supported together with credentials.
    cors_allowed_origins: str = "http://localhost:5173,http://localhost:4173"

    # ─── Database ────────────────────────────────────────────────
    # NOTE: the actual connection uses `database_url` only. The fields below
    # are informational; keep real credentials out of source — set them via
    # DATABASE_URL / POSTGRES_PASSWORD in the environment (.env), never here.
    database_host: str = "localhost"
    database_port: int = 5432
    database_name: str = "project23_db"
    database_user: str = "project23_user"
    database_password: str = ""
    database_url: str

    @property
    def cors_origins_list(self) -> list[str]:
        """Parsed, de-duplicated list of allowed CORS origins."""
        return [o.strip() for o in self.cors_allowed_origins.split(",") if o.strip()]

    # ─── Redis ───────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"

    # ─── Storage ─────────────────────────────────────────────────
    media_path: str = "./media"
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
