"""
Local Storage Service — handles file save/delete for photos and videos.
"""
import os
import uuid
import shutil
import io
from datetime import datetime
from pathlib import Path
from typing import Optional
from fastapi import UploadFile
from PIL import Image, UnidentifiedImageError

MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


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
        """
        Save employee photo — return relative file path.

        Validates the actual file contents (via PIL), not just the
        filename extension -- a filename ending in .jpg proves nothing
        about what bytes are actually inside it. Also enforces a size
        limit, which was previously unbounded.
        """
        try:
            ext = Path(file.filename).suffix.lower()
            if ext not in [".jpg", ".jpeg", ".png"]:
                raise ValueError("Only JPG/PNG allowed")

            content = await file.read()

            if len(content) > MAX_PHOTO_SIZE_BYTES:
                raise ValueError(
                    f"File too large. Max {MAX_PHOTO_SIZE_BYTES // (1024*1024)} MB"
                )
            if len(content) < 100:
                raise ValueError("File appears empty or corrupted")

            # Real content check: attempt to actually open and verify the
            # image. A renamed non-image file (e.g. malware.exe -> photo.jpg)
            # fails here even though it passed the extension check above.
            try:
                img = Image.open(io.BytesIO(content))
                img.verify()
            except UnidentifiedImageError:
                raise ValueError("File is not a valid image")
            except Exception:
                raise ValueError("File is not a valid image")

            filename  = f"{employee_code}_{uuid.uuid4().hex[:8]}{ext}"
            save_path = self.base_path / "employees" / "photos" / filename

            with open(save_path, "wb") as buffer:
                buffer.write(content)

            return str(save_path)
        except ValueError:
            raise
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
