"""
ZoneMonitor -- polygon-in-point test for restricted-area violations.
Reads zone_config JSONB from the camera row, format:
{
  "restricted_zones": [
    { "name": "Server Room Door", "polygon": [[x1,y1],[x2,y2],...] }
  ]
}
Uses person detection boxes from YOLO (bottom-center point = feet position)
to test whether a person is standing inside any restricted polygon.
"""
from typing import List, Dict, Optional

import numpy as np
import structlog

from app.infrastructure.ai.activity_detection.yolo_detector import (
    yolo_detector, COCO_PERSON_CLASS_ID,
)

logger = structlog.get_logger(__name__)


def _point_in_polygon(point: tuple, polygon: List[List[float]]) -> bool:
    """
    Ray-casting algorithm. point = (x, y). polygon = [[x,y], [x,y], ...].
    Pure Python, no extra dependency needed.
    """
    x, y = point
    n = len(polygon)
    inside = False
    p1x, p1y = polygon[0]
    for i in range(1, n + 1):
        p2x, p2y = polygon[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    else:
                        xinters = p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside


class ZoneMonitor:
    """Detects persons standing inside restricted zone polygons."""

    def __init__(self, confidence_threshold: float = 0.5) -> None:
        self.confidence_threshold = confidence_threshold

    def detect_persons(self, frame_bgr: np.ndarray) -> List[Dict]:
        """Return list of person detections in this frame."""
        detections = yolo_detector.detect(frame_bgr, conf=self.confidence_threshold)
        return [d for d in detections if d["class_id"] == COCO_PERSON_CLASS_ID]

    def check_violations(self, frame_bgr: np.ndarray, zone_config: Optional[dict]) -> List[Dict]:
        """
        Check every detected person against every restricted zone polygon.

        Args:
            frame_bgr: current camera frame
            zone_config: camera.zone_config JSONB dict (may be None)

        Returns:
            List of violation dicts: {zone_name, box, confidence}
        """
        if not zone_config:
            return []
        zones = zone_config.get("restricted_zones", [])
        if not zones:
            return []

        persons = self.detect_persons(frame_bgr)
        if not persons:
            return []

        violations: List[Dict] = []
        for person in persons:
            x1, y1, x2, y2 = person["box"]
            # feet point = bottom-center of bounding box
            feet_point = ((x1 + x2) / 2, y2)

            for zone in zones:
                polygon = zone.get("polygon", [])
                if len(polygon) < 3:
                    continue
                if _point_in_polygon(feet_point, polygon):
                    violations.append({
                        "zone_name": zone.get("name", "Unnamed Zone"),
                        "box": person["box"],
                        "confidence": person["confidence"],
                    })

        return violations


# Module-level default instance
zone_monitor = ZoneMonitor(confidence_threshold=0.5)
