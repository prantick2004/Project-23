"""
Local Storage Service — handles file save/delete for photos and videos.
"""
import os
import uuid
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional
from fastapi import UploadFile


class LocalStorageService:
    """Manages local file storage for employee photos and evidence."""

    def __init__(self, base_path: str = "media"):
        self.base_path = Path(base_path)
        self._create_directories()

    def _create_directories(self) -> None:
        """Create required storage directories."""
        dirs = [
            self.base_path / "employees" / "photos",
            self.base_path / "employees" / "datasets",
            self.base_path / "evidence" / "screenshots",
            self.base_path / "evidence" / "videos",
        ]
        for d in dirs:
            d.mkdir(parents=True, exist_ok=True)

    async def save_employee_photo(
        self, file: UploadFile, employee_code: str
    ) -> Optional[str]:
        """Save employee photo — return relative file path."""
        try:
            ext = Path(file.filename).suffix.lower()
            if ext not in [".jpg", ".jpeg", ".png"]:
                raise ValueError("Only JPG/PNG allowed")

            filename  = f"{employee_code}_{uuid.uuid4().hex[:8]}{ext}"
            save_path = self.base_path / "employees" / "photos" / filename

            with open(save_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            return str(save_path)
        except Exception as e:
            raise RuntimeError(f"Photo save failed: {e}")

    def delete_file(self, file_path: str) -> bool:
        """Delete file from storage."""
        try:
            path = Path(file_path)
            if path.exists():
                path.unlink()
                return True
            return False
        except Exception:
            return False

    def get_file_url(self, file_path: str) -> Optional[str]:
        """Convert storage path to accessible URL."""
        if not file_path:
            return None
        return f"/media/{Path(file_path).relative_to(self.base_path)}"
