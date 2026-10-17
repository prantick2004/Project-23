"""
Isolated screenshot writer for the live webcam demo.

Writes ONLY to <repo>/demo_evidence/ — never to the production evidence store
(media/evidence/...), never to a user-supplied path, and never to the database.
Filenames are generated here (timestamp + sanitised label + random suffix) and
files are created exclusively, so an existing file can never be overwritten.
"""
import logging
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import cv2
import numpy as np

logger = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_EVIDENCE_DIR = REPO_ROOT / "demo_evidence"

JPEG_QUALITY = 90
_MAX_ATTEMPTS = 5
_UNSAFE = re.compile(r"[^a-z0-9_]+")


def safe_label(label: str) -> str:
    """Reduce an arbitrary label to [a-z0-9_] (max 40 chars) for use in a filename."""
    cleaned = _UNSAFE.sub("_", str(label).lower()).strip("_")[:40]
    return cleaned or "event"


class DemoEvidenceWriter:
    """
    `directory` exists so tests can point at a temporary folder. The CLI never
    exposes it: real runs always use DEFAULT_EVIDENCE_DIR.
    """

    def __init__(self, directory: Optional[Path] = None) -> None:
        self.directory = Path(directory) if directory is not None else DEFAULT_EVIDENCE_DIR

    def save(
        self,
        frame_bgr: np.ndarray,
        label: str,
        now: Optional[datetime] = None,
    ) -> Optional[Path]:
        """Encode and write one JPEG. Returns its path, or None if it could not be saved."""
        now = now or datetime.now(timezone.utc)
        stamp = now.astimezone(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

        ok, buffer = cv2.imencode(".jpg", frame_bgr, [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY])
        if not ok:
            logger.error("Could not encode screenshot")
            return None

        try:
            self.directory.mkdir(parents=True, exist_ok=True, mode=0o700)
            base = self.directory.resolve()
        except OSError as exc:
            logger.error("Could not prepare demo evidence directory: %s", exc)
            return None

        for _ in range(_MAX_ATTEMPTS):
            name = f"demo_{stamp}_{safe_label(label)}_{uuid.uuid4().hex[:8]}.jpg"
            path = base / name
            if path.parent != base:  # defensive: the name must never contain a path
                logger.error("Refusing to write outside the demo evidence directory")
                return None
            try:
                with open(path, "xb") as handle:  # 'x' = fail if it already exists
                    handle.write(buffer.tobytes())
                return path
            except FileExistsError:
                continue
            except OSError as exc:
                logger.error("Could not write screenshot: %s", exc)
                return None

        logger.error("Could not find an unused screenshot filename")
        return None
