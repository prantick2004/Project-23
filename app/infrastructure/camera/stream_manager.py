"""
CameraStreamManager — singleton managing all active camera threads.
Each camera runs in its own daemon thread reading frames continuously.
API handlers never call cv2 directly — they read the latest cached frame
from here, keeping the asyncio event loop unblocked.
"""
import asyncio
import threading
import time
from datetime import datetime, timezone
from typing import Optional, Dict
from uuid import UUID

import numpy as np
import structlog

from app.infrastructure.camera.base_camera import BaseCameraStream
from app.infrastructure.camera.camera_factory import CameraFactory
from app.infrastructure.camera.main_loop import get_main_loop
from app.infrastructure.ai.face_recognition.face_detector import face_detector
from app.infrastructure.ai.face_recognition.face_encoder import face_encoder
from app.infrastructure.ai.face_recognition.face_recognizer import face_recognizer, RecognitionResult
from app.infrastructure.ai.activity_detection.activity_analyzer import activity_analyzer

logger = structlog.get_logger(__name__)


async def _process_attendance_async(camera_id: str, employee_id: str, confidence: float) -> None:
    """
    Runs on the MAIN event loop (scheduled via run_coroutine_threadsafe).
    Opens its own DB session — separate from any request-scoped session.
    """
    from app.infrastructure.database.connection import AsyncSessionFactory
    from app.repositories.employee_repository import EmployeeRepository
    from app.services.attendance_service import AttendanceService

    async with AsyncSessionFactory() as session:
        try:
            emp_repo = EmployeeRepository(session)
            employee = await emp_repo.get_by_id(employee_id)
            if employee is None:
                return
            service = AttendanceService(session)
            result = await service.process_recognition(
                employee=employee,
                camera_id=UUID(camera_id),
                timestamp=datetime.now(timezone.utc),
                confidence=confidence,
            )
            if result is not None:
                logger.info(
                    "attendance_event",
                    employee_id=employee_id,
                    camera_id=camera_id,
                    check_in=str(result.check_in_time),
                    check_out=str(result.check_out_time),
                    status=str(result.status),
                )
                from app.api.websockets.attendance_stream import attendance_broadcaster
                await attendance_broadcaster.broadcast({
                    "type": "attendance_update",
                    "payload": {
                        "employee_id": employee_id,
                        "camera_id": camera_id,
                        "check_in_time": result.check_in_time.isoformat() if result.check_in_time else None,
                        "check_out_time": result.check_out_time.isoformat() if result.check_out_time else None,
                        "status": result.status.value if hasattr(result.status, "value") else str(result.status),
                    },
                })
        except Exception as e:
            logger.error("attendance_processing_failed", employee_id=employee_id, error=str(e))


async def _process_heartbeat_async(camera_id: str, heartbeat) -> None:
    """
    Runs on the MAIN event loop (scheduled via run_coroutine_threadsafe).
    Persists last_heartbeat to DB — throttled, not called every frame.
    """
    from app.infrastructure.database.connection import AsyncSessionFactory
    from app.repositories.camera_repository import CameraRepository

    async with AsyncSessionFactory() as session:
        try:
            repo = CameraRepository(session)
            await repo.update_heartbeat(camera_id, heartbeat)
        except Exception as e:
            logger.error("heartbeat_persist_failed", camera_id=camera_id, error=str(e))


async def _process_activity_async(
    camera_id: str,
    activity_type: str,
    confidence_score: float,
    bounding_box: dict,
    description: str,
    employee_id: str = None,
    duration_seconds: int = None,
    camera_code: str = "",
    frame_bgr: np.ndarray = None,
) -> None:
    """
    Runs on the MAIN event loop (scheduled via run_coroutine_threadsafe).
    Opens its own DB session, same pattern as _process_attendance_async.
    On a successful (non-cooldown-suppressed) activity log, also captures
    evidence (screenshot) and creates + broadcasts an alert — Phase 8.
    """
    from app.infrastructure.database.connection import AsyncSessionFactory
    from app.services.activity_service import ActivityService
    from app.services.evidence_service import EvidenceService
    from app.services.alert_service import AlertService
    from app.api.websockets.alert_stream import alert_broadcaster
    from app.core.constants import ActivityType

    async with AsyncSessionFactory() as session:
        try:
            service = ActivityService(session)
            activity_enum = ActivityType[activity_type]
            result = await service.process_detection(
                camera_id=UUID(camera_id),
                activity_type=activity_enum,
                confidence_score=confidence_score,
                bounding_box=bounding_box,
                description=description,
                employee_id=UUID(employee_id) if employee_id else None,
                duration_seconds=duration_seconds,
            )
            if result is not None:
                logger.info(
                    "activity_event",
                    camera_id=camera_id,
                    activity_type=activity_type,
                    employee_id=employee_id,
                )

                if frame_bgr is not None:
                    evidence_service = EvidenceService(session)
                    await evidence_service.capture_evidence(
                        activity_log_id=result.id,
                        camera_id=UUID(camera_id),
                        activity_type=activity_type,
                        frame_bgr=frame_bgr,
                        employee_id=UUID(employee_id) if employee_id else None,
                    )

                alert_service = AlertService(session)
                alert = await alert_service.create_alert(
                    activity_log_id=result.id,
                    activity_type=activity_enum,
                    camera_code=camera_code or camera_id,
                    employee_name=None,
                )

                await alert_broadcaster.broadcast({
                    "type": "new_alert",
                    "payload": {
                        "id": str(alert.id),
                        "severity": alert.severity.value,
                        "title": alert.title,
                        "camera": camera_code or camera_id,
                        "timestamp": alert.created_at.isoformat(),
                    },
                })
        except Exception as e:
            logger.error("activity_processing_failed", camera_id=camera_id, error=str(e))


class _CameraWorker:
    """Internal per-camera thread wrapper. Holds latest frame + status."""

    def __init__(
        self,
        camera_id: str,
        stream: BaseCameraStream,
        camera_code: str = "",
        is_attendance_cam: bool = False,
        is_activity_cam: bool = False,
        zone_config: Optional[dict] = None,
    ) -> None:
        self.camera_id = camera_id
        self.stream = stream
        self.camera_code = camera_code
        self.is_attendance_cam = is_attendance_cam
        self.is_activity_cam = is_activity_cam
        self.zone_config = zone_config
        self.latest_frame: Optional[np.ndarray] = None
        self.last_heartbeat: Optional[datetime] = None
        self.is_running: bool = False
        self._lock = threading.Lock()
        self._thread: Optional[threading.Thread] = None
        self.latest_recognitions: list = []
        self.latest_activities: list = []
        self._read_count: int = 0
        self._recognition_every_n_reads: int = 10  # kept for reference, no longer used to gate inference
        self._heartbeat_every_n_reads: int = 150  # ~1x/5sec at 30 reads/sec loop
        self._inference_interval_seconds: float = 0.33  # ~3x/sec, runs on its own thread now
        self._inference_thread: Optional[threading.Thread] = None

    def start(self) -> bool:
        if not self.stream.connect():
            logger.error("camera_connect_failed", camera_id=self.camera_id)
            return False
        self.is_running = True
        self._thread = threading.Thread(target=self._capture_loop, daemon=True)
        self._thread.start()
        self._inference_thread = threading.Thread(target=self._inference_loop, daemon=True)
        self._inference_thread.start()
        logger.info("camera_thread_started", camera_id=self.camera_id)
        return True

    def _capture_loop(self) -> None:
        """Loop: read frame -> cache it -> repeat. Runs in background thread.
        Never blocked by AI inference anymore -- that runs on a separate
        thread (_inference_loop) so the live stream stays smooth."""
        while self.is_running:
            frame = self.stream.read_frame()
            if frame is not None:
                with self._lock:
                    self.latest_frame = frame
                    self.last_heartbeat = datetime.now(timezone.utc)
                self._read_count += 1
                if self._read_count % self._heartbeat_every_n_reads == 0:
                    self._dispatch_heartbeat()
            time.sleep(0.03)  # ~30 reads/sec cap; actual FPS limited by camera

    def _inference_loop(self) -> None:
        """Runs face recognition + activity detection on a snapshot of the
        latest frame, on its own thread, so slow CPU inference never blocks
        frame capture or the live WebSocket stream."""
        while self.is_running:
            frame = self.get_latest_frame()
            if frame is not None:
                self._run_recognition(frame)
                if self.is_activity_cam:
                    self._run_activity_detection(frame)
            time.sleep(self._inference_interval_seconds)

    def get_latest_frame(self) -> Optional[np.ndarray]:
        with self._lock:
            return None if self.latest_frame is None else self.latest_frame.copy()

    def _run_recognition(self, frame: np.ndarray) -> None:
        """Detect + recognize faces in one frame. Runs inside the camera thread."""
        try:
            boxes = face_detector.detect(frame)
            results: list = []
            for box in boxes:
                encoding = face_encoder.encode(frame, box)
                if encoding is None:
                    continue
                result = face_recognizer.recognize(encoding)
                results.append({
                    "box": box,
                    "employee_id": str(result.employee_id) if result.employee_id else None,
                    "confidence": result.confidence,
                    "is_match": result.is_match,
                })
                if self.is_attendance_cam and result.is_match and result.employee_id:
                    self._dispatch_attendance(str(result.employee_id), result.confidence)

            with self._lock:
                self.latest_recognitions = results
            if results:
                logger.info("faces_recognized", camera_id=self.camera_id, count=len(results))
        except Exception as e:
            logger.error("recognition_failed", camera_id=self.camera_id, error=str(e))

    def _dispatch_attendance(self, employee_id: str, confidence: float) -> None:
        """Schedule the async attendance update on the main event loop from this thread."""
        loop = get_main_loop()
        if loop is None:
            logger.warning("attendance_dispatch_skipped_no_loop", camera_id=self.camera_id)
            return
        asyncio.run_coroutine_threadsafe(
            _process_attendance_async(self.camera_id, employee_id, confidence),
            loop,
        )

    def _dispatch_heartbeat(self) -> None:
        """Schedule a throttled DB heartbeat update on the main event loop."""
        loop = get_main_loop()
        if loop is None:
            return
        asyncio.run_coroutine_threadsafe(
            _process_heartbeat_async(self.camera_id, self.last_heartbeat),
            loop,
        )

    def _run_activity_detection(self, frame: np.ndarray) -> None:
        """Run YOLO-based activity detection on one frame. Runs inside camera thread."""
        try:
            events = activity_analyzer.analyze_frame(
                camera_id=self.camera_id,
                frame_bgr=frame,
                zone_config=self.zone_config,
            )
            with self._lock:
                self.latest_activities = events
            for event in events:
                self._dispatch_activity(event, frame)
            if events:
                logger.info("activities_detected", camera_id=self.camera_id, count=len(events))
        except Exception as e:
            logger.error("activity_detection_failed", camera_id=self.camera_id, error=str(e))

    def _dispatch_activity(self, event: dict, frame: np.ndarray) -> None:
        """Schedule the async activity-log write on the main event loop from this thread."""
        loop = get_main_loop()
        if loop is None:
            logger.warning("activity_dispatch_skipped_no_loop", camera_id=self.camera_id)
            return
        asyncio.run_coroutine_threadsafe(
            _process_activity_async(
                camera_id=self.camera_id,
                camera_code=self.camera_code,
                activity_type=event["activity_type"].name,
                confidence_score=event["confidence_score"],
                bounding_box=event.get("bounding_box"),
                description=event.get("description"),
                employee_id=None,  # activity events are not tied to a recognized employee yet
                duration_seconds=event.get("duration_seconds"),
                frame_bgr=frame.copy(),
            ),
            loop,
        )

    def get_latest_recognitions(self) -> list:
        with self._lock:
            return list(self.latest_recognitions)

    def get_latest_activities(self) -> list:
        with self._lock:
            return list(self.latest_activities)

    def stop(self) -> None:
        self.is_running = False
        if self._thread:
            self._thread.join(timeout=2)
        if self._inference_thread:
            self._inference_thread.join(timeout=2)
        self.stream.release()
        logger.info("camera_thread_stopped", camera_id=self.camera_id)


class CameraStreamManager:
    """
    Singleton registry of all running camera workers.
    Use the module-level `stream_manager` instance everywhere.
    """

    def __init__(self) -> None:
        self._workers: Dict[str, _CameraWorker] = {}

    def start_camera(
        self,
        camera_id: str,
        camera_type: str,
        connection_string: str,
        camera_code: str,
        is_attendance_cam: bool = False,
        is_activity_cam: bool = False,
        zone_config: Optional[dict] = None,
    ) -> bool:
        """Start a camera by ID. No-op (returns True) if already running."""
        if camera_id in self._workers and self._workers[camera_id].is_running:
            return True

        stream = CameraFactory.create_camera(camera_type, connection_string, camera_code)
        worker = _CameraWorker(
            camera_id, stream,
            camera_code=camera_code,
            is_attendance_cam=is_attendance_cam,
            is_activity_cam=is_activity_cam,
            zone_config=zone_config,
        )
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

    def get_recognitions(self, camera_id: str) -> list:
        """Get latest per-frame recognition results for a camera, or empty list."""
        worker = self._workers.get(camera_id)
        return worker.get_latest_recognitions() if worker else []

    def get_activities(self, camera_id: str) -> list:
        """Get latest per-frame activity detection results for a camera, or empty list."""
        worker = self._workers.get(camera_id)
        return worker.get_latest_activities() if worker else []

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
