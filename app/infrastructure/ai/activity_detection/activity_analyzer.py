"""
ActivityAnalyzer -- orchestrates PhoneDetector, PostureAnalyzer, ZoneMonitor
for a single frame. Runs inside the camera worker thread, same place
face recognition already runs. Returns a flat list of raw detection events;
cooldown/dedup and DB writes happen one layer up in ActivityService.
"""
from typing import Dict, List, Optional

import numpy as np
import structlog

from app.infrastructure.ai.activity_detection.phone_detector import phone_detector
from app.infrastructure.ai.activity_detection.posture_analyzer import posture_analyzer
from app.infrastructure.ai.activity_detection.zone_monitor import zone_monitor
from app.core.constants import ActivityType

logger = structlog.get_logger(__name__)


class ActivityAnalyzer:
    """Runs all activity detectors against one frame, returns raw events."""

    def analyze_frame(
        self,
        camera_id: str,
        frame_bgr: np.ndarray,
        zone_config: Optional[dict] = None,
    ) -> List[Dict]:
        """
        Returns a list of raw event dicts, each:
            {
              "activity_type": ActivityType,
              "confidence_score": float,
              "bounding_box": {"x":..,"y":..,"w":..,"h":..},
              "description": str,
            }
        No DB writes here -- pure detection only.
        """
        events: List[Dict] = []

        # --- Phone usage ---
        try:
            phone = phone_detector.is_phone_present(frame_bgr)
            if phone is not None:
                x1, y1, x2, y2 = phone["box"]
                events.append({
                    "activity_type": ActivityType.MOBILE_PHONE_USAGE,
                    "confidence_score": phone["confidence"],
                    "bounding_box": {"x": x1, "y": y1, "w": x2 - x1, "h": y2 - y1},
                    "description": "Mobile phone detected in frame",
                })
        except Exception as e:
            logger.error("phone_detection_error", camera_id=camera_id, error=str(e))

        # --- Sleeping / inactivity ---
        try:
            posture = posture_analyzer.analyze(camera_id, frame_bgr)
            if posture["person_box"] is not None:
                x1, y1, x2, y2 = posture["person_box"]
                box_dict = {"x": x1, "y": y1, "w": x2 - x1, "h": y2 - y1}

                if posture["is_sleeping"]:
                    events.append({
                        "activity_type": ActivityType.SLEEPING,
                        "confidence_score": 0.6,  # heuristic-based, fixed moderate confidence
                        "bounding_box": box_dict,
                        "description": "Person posture suggests lying down / sleeping",
                    })

                if posture["is_inactive"]:
                    events.append({
                        "activity_type": ActivityType.LONG_INACTIVITY,
                        "confidence_score": 0.6,
                        "bounding_box": box_dict,
                        "description": f"No movement detected for {posture['inactive_duration_seconds']}s",
                        "duration_seconds": posture["inactive_duration_seconds"],
                    })
        except Exception as e:
            logger.error("posture_analysis_error", camera_id=camera_id, error=str(e))

        # --- Restricted zone violations ---
        try:
            violations = zone_monitor.check_violations(frame_bgr, zone_config)
            for v in violations:
                x1, y1, x2, y2 = v["box"]
                events.append({
                    "activity_type": ActivityType.RESTRICTED_AREA_VIOLATION,
                    "confidence_score": v["confidence"],
                    "bounding_box": {"x": x1, "y": y1, "w": x2 - x1, "h": y2 - y1},
                    "description": f"Person detected in restricted zone: {v['zone_name']}",
                })
        except Exception as e:
            logger.error("zone_monitor_error", camera_id=camera_id, error=str(e))

        return events


# Module-level default instance
activity_analyzer = ActivityAnalyzer()
