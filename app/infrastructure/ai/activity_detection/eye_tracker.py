"""
EyeTracker -- detects closed eyes via facial landmarks (dlib, through the
existing face_recognition dependency -- no new model needed).

Uses the standard Eye Aspect Ratio (EAR) technique: 6 landmark points per
eye give a ratio of eye height to eye width. Open eyes -> higher EAR.
Closed eyes -> EAR drops sharply. A single low-EAR frame could just be a
blink, so this tracks sustained closure over multiple consecutive frames
before treating it as a real "sleeping" signal.
"""
import math
import threading
import time
from typing import Dict, List, Optional, Tuple

import numpy as np
import face_recognition
import structlog

logger = structlog.get_logger(__name__)

# EAR below this = eyes considered closed for that frame
EAR_CLOSED_THRESHOLD = 0.21

# Eyes must stay closed for this many seconds before counting as "sleeping"
# (filters out normal blinks, which last ~0.1-0.4s)
SUSTAINED_CLOSURE_SECONDS = 2.0


def _euclidean(p1: Tuple[int, int], p2: Tuple[int, int]) -> float:
    return math.dist(p1, p2)


def _eye_aspect_ratio(eye_points: List[Tuple[int, int]]) -> float:
    """
    Standard 6-point EAR formula.
    eye_points order (face_recognition convention): outer to inner,
    top two, bottom two -- 6 points total per eye.
    """
    if len(eye_points) != 6:
        return 1.0  # can't compute, assume open (fail safe -- no false sleep alerts)

    vertical_1 = _euclidean(eye_points[1], eye_points[5])
    vertical_2 = _euclidean(eye_points[2], eye_points[4])
    horizontal = _euclidean(eye_points[0], eye_points[3])

    if horizontal == 0:
        return 1.0

    return (vertical_1 + vertical_2) / (2.0 * horizontal)


class EyeTracker:
    """
    Thread-safe. Tracks per-camera sustained eye-closure duration.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        # camera_id -> closure_started_timestamp (None if eyes currently open)
        self._closure_start: Dict[str, Optional[float]] = {}

    def analyze(self, camera_id: str, frame_bgr: np.ndarray, face_box: Tuple[int, int, int, int]) -> Dict:
        """
        Check eye closure for one already-detected face.

        Args:
            camera_id: for per-camera closure tracking
            frame_bgr: OpenCV frame, BGR
            face_box: (top, right, bottom, left) -- same box format used
                      by face_detector, so landmark lookup is scoped to
                      this one face instead of re-detecting from scratch.

        Returns dict:
            {
              "avg_ear": float,
              "eyes_closed": bool,           # this frame only
              "sustained_closed": bool,      # closed for >= threshold seconds
              "closed_duration_seconds": float,
            }
        """
        rgb_frame = np.ascontiguousarray(frame_bgr[:, :, ::-1])

        try:
            landmarks_list = face_recognition.face_landmarks(
                rgb_frame, face_locations=[face_box]
            )
        except Exception as e:
            logger.error("landmark_detection_failed", camera_id=camera_id, error=str(e))
            return self._no_signal()

        if not landmarks_list:
            return self._no_signal()

        landmarks = landmarks_list[0]
        left_eye = landmarks.get("left_eye")
        right_eye = landmarks.get("right_eye")

        if not left_eye or not right_eye:
            return self._no_signal()

        left_ear = _eye_aspect_ratio(left_eye)
        right_ear = _eye_aspect_ratio(right_eye)
        avg_ear = (left_ear + right_ear) / 2.0

        eyes_closed = avg_ear < EAR_CLOSED_THRESHOLD
        now = time.time()
        sustained_closed = False
        closed_duration = 0.0

        with self._lock:
            if eyes_closed:
                start = self._closure_start.get(camera_id)
                if start is None:
                    self._closure_start[camera_id] = now
                    closed_duration = 0.0
                else:
                    closed_duration = now - start
                    if closed_duration >= SUSTAINED_CLOSURE_SECONDS:
                        sustained_closed = True
            else:
                self._closure_start[camera_id] = None

        return {
            "avg_ear": round(avg_ear, 3),
            "eyes_closed": eyes_closed,
            "sustained_closed": sustained_closed,
            "closed_duration_seconds": round(closed_duration, 1),
        }

    def _no_signal(self) -> Dict:
        return {
            "avg_ear": None,
            "eyes_closed": False,
            "sustained_closed": False,
            "closed_duration_seconds": 0.0,
        }


# Module-level default instance
eye_tracker = EyeTracker()
