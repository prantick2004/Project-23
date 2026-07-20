"""
PostureAnalyzer -- sleep/inactivity estimation.

Simplification note: uses YOLO person bounding boxes only (no separate
pose-estimation model / extra weight download). Two signals:

  1. Inactivity: tracks each camera's last-seen person centroid + timestamp.
     If centroid barely moves for N seconds, flags long_inactivity.
  2. Sleeping heuristic: bounding box aspect ratio (width > height) suggests
     a lying-down / slumped posture rather than standing/sitting upright.

This is a reasonable first pass. Swap in real YOLOv8-pose keypoints later
for higher accuracy without changing the public interface below.
"""
import threading
import time
from typing import Dict, List, Optional, Tuple

import numpy as np
import structlog

from app.infrastructure.ai.activity_detection.yolo_detector import (
    yolo_detector, COCO_PERSON_CLASS_ID,
)

logger = structlog.get_logger(__name__)

# How much centroid movement (pixels) counts as "still" between checks
MOVEMENT_THRESHOLD_PX = 25
# How long (seconds) a person must stay still before flagging inactivity
INACTIVITY_THRESHOLD_SECONDS = 30 * 60  # 30 minutes, matches system_settings default
# Aspect ratio (width / height) above which a box looks "lying down"
SLEEPING_ASPECT_RATIO = 1.3


class PostureAnalyzer:
    """
    Thread-safe. Tracks last-known person position per camera to detect
    prolonged inactivity, plus a cheap sleeping heuristic per frame.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        # camera_id -> (centroid_x, centroid_y, first_still_timestamp)
        self._tracking: Dict[str, Tuple[float, float, float]] = {}

    def detect_persons(self, frame_bgr: np.ndarray, confidence: float = 0.5) -> List[Dict]:
        detections = yolo_detector.detect(frame_bgr, conf=confidence)
        return [d for d in detections if d["class_id"] == COCO_PERSON_CLASS_ID]

    def analyze(self, camera_id: str, frame_bgr: np.ndarray) -> Dict:
        """
        Run posture analysis for one frame from one camera.

        Returns dict:
            {
              "is_sleeping": bool,
              "is_inactive": bool,
              "inactive_duration_seconds": int,
              "person_box": [x1,y1,x2,y2] or None,
            }
        """
        persons = self.detect_persons(frame_bgr)
        if not persons:
            with self._lock:
                self._tracking.pop(camera_id, None)
            return {
                "is_sleeping": False,
                "is_inactive": False,
                "inactive_duration_seconds": 0,
                "person_box": None,
            }

        # Use the largest/most confident person detection for this simple model
        person = max(persons, key=lambda d: d["confidence"])
        x1, y1, x2, y2 = person["box"]
        width, height = (x2 - x1), (y2 - y1)
        centroid = ((x1 + x2) / 2, (y1 + y2) / 2)

        is_sleeping = height > 0 and (width / height) >= SLEEPING_ASPECT_RATIO

        now = time.time()
        is_inactive = False
        inactive_duration = 0

        with self._lock:
            prev = self._tracking.get(camera_id)
            if prev is None:
                self._tracking[camera_id] = (centroid[0], centroid[1], now)
            else:
                prev_x, prev_y, still_since = prev
                moved = (
                    abs(centroid[0] - prev_x) > MOVEMENT_THRESHOLD_PX
                    or abs(centroid[1] - prev_y) > MOVEMENT_THRESHOLD_PX
                )
                if moved:
                    self._tracking[camera_id] = (centroid[0], centroid[1], now)
                else:
                    inactive_duration = int(now - still_since)
                    if inactive_duration >= INACTIVITY_THRESHOLD_SECONDS:
                        is_inactive = True

        return {
            "is_sleeping": is_sleeping,
            "is_inactive": is_inactive,
            "inactive_duration_seconds": inactive_duration,
            "person_box": person["box"],
        }


# Module-level default instance
posture_analyzer = PostureAnalyzer()
