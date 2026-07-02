"""
CameraStreamManager — singleton managing all active camera threads.
Each camera runs in its own daemon thread reading frames continuously.
API handlers never call cv2 directly — they read the latest cached frame
from here, keeping the asyncio event loop unblocked.
"""
import threading
import time
from datetime import datetime, timezone
from typing import Optional, Dict

import numpy as np
import structlog

from app.infrastructure.camera.base_camera import BaseCameraStream
from app.infrastructure.camera.camera_factory import CameraFactory

logger = structlog.get_logger(__name__)


class _CameraWorker:
    """Internal per-camera thread wrapper. Holds latest frame + status."""

    def __init__(self, camera_id: str, stream: BaseCameraStream) -> None:
        self.camera_id = camera_id
        self.stream = stream
        self.latest_frame: Optional[np.ndarray] = None
        self.last_heartbeat: Optional[datetime] = None
        self.is_running: bool = False
        self._lock = threading.Lock()
        self._thread: Optional[threading.Thread] = None

    def start(self) -> bool:
        if not self.stream.connect():
            logger.error("camera_connect_failed", camera_id=self.camera_id)
            return False
        self.is_running = True
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()
        logger.info("camera_thread_started", camera_id=self.camera_id)
        return True

    def _run(self) -> None:
        """Loop: read frame -> cache it -> repeat. Runs in background thread."""
        while self.is_running:
            frame = self.stream.read_frame()
            if frame is not None:
                with self._lock:
                    self.latest_frame = frame
                    self.last_heartbeat = datetime.now(timezone.utc)
            time.sleep(0.03)  # ~30 reads/sec cap; actual FPS limited by camera

    def get_latest_frame(self) -> Optional[np.ndarray]:
        with self._lock:
            return None if self.latest_frame is None else self.latest_frame.copy()

    def stop(self) -> None:
        self.is_running = False
        if self._thread:
            self._thread.join(timeout=2)
        self.stream.release()
        logger.info("camera_thread_stopped", camera_id=self.camera_id)


class CameraStreamManager:
    """
    Singleton registry of all running camera workers.
    Use the module-level `stream_manager` instance everywhere.
    """

    def __init__(self) -> None:
        self._workers: Dict[str, _CameraWorker] = {}

    def start_camera(self, camera_id: str, camera_type: str, connection_string: str, camera_code: str) -> bool:
        """Start a camera by ID. No-op (returns True) if already running."""
        if camera_id in self._workers and self._workers[camera_id].is_running:
            return True

        stream = CameraFactory.create_camera(camera_type, connection_string, camera_code)
        worker = _CameraWorker(camera_id, stream)
        started = worker.start()
        if started:
            self._workers[camera_id] = worker
        return started

    def stop_camera(self, camera_id: str) -> bool:
        """Stop a running camera by ID. Returns True if it was running."""
        worker = self._workers.get(camera_id)
        if not worker:
            return False
        worker.stop()
        del self._workers[camera_id]
        return True

    def get_frame(self, camera_id: str) -> Optional[np.ndarray]:
        """Get latest cached frame for a camera, or None if not running."""
        worker = self._workers.get(camera_id)
        return worker.get_latest_frame() if worker else None

    def is_running(self, camera_id: str) -> bool:
        worker = self._workers.get(camera_id)
        return bool(worker and worker.is_running)

    def get_last_heartbeat(self, camera_id: str) -> Optional[datetime]:
        worker = self._workers.get(camera_id)
        return worker.last_heartbeat if worker else None

    def stop_all(self) -> None:
        """Stop every running camera — call on app shutdown."""
        for camera_id in list(self._workers.keys()):
            self.stop_camera(camera_id)


# Module-level singleton — import this everywhere
stream_manager = CameraStreamManager()
