"""
MediaHandler — saves screenshot evidence to disk when an activity event fires.
Reuses the same base_path ("media/") and directory layout as LocalStorageService.
Video clip buffering is out of scope for this pass (see Phase 8 notes) —
screenshot only, consistent with what the live camera frame gives us at
detection time.
"""
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
import structlog

logger = structlog.get_logger(__name__)


class MediaHandler:
    """Saves activity-event screenshots under media/evidence/screenshots/."""

    def __init__(self, base_path: str = "media") -> None:
        self.base_path = Path(base_path)
        self.screenshots_dir = self.base_path / "evidence" / "screenshots"
        self.screenshots_dir.mkdir(parents=True, exist_ok=True)

    def save_screenshot(
        self,
        frame_bgr: np.ndarray,
        camera_id: str,
        activity_type: str,
    ) -> Optional[dict]:
        """
        Encode frame as JPEG and write to disk.
        Returns dict: {screenshot_path, file_size_bytes} or None on failure.
        Synchronous / blocking (cv2.imwrite) — acceptable for a single small
        JPEG at current event rate; revisit with asyncio.to_thread if this
        becomes a bottleneck under high event volume.
        """
        try:
            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
            uid = uuid.uuid4().hex[:8]
            filename = f"{camera_id}_{activity_type.lower()}_{ts}_{uid}.jpg"
            save_path = self.screenshots_dir / filename

            success = cv2.imwrite(str(save_path), frame_bgr)
            if not success:
                logger.error("screenshot_save_failed", camera_id=camera_id)
                return None

            file_size = save_path.stat().st_size
            return {
                "screenshot_path": str(save_path),
                "file_size_bytes": file_size,
            }
        except Exception as e:
            logger.error("screenshot_save_exception", camera_id=camera_id, error=str(e))
            return None


# Module-level singleton — import this everywhere
media_handler = MediaHandler()
