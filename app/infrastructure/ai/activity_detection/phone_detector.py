"""
PhoneDetector -- filters YOLO detections down to 'cell phone' class only.
Maps a raw YOLO detection into a phone-usage activity signal.
"""
from typing import List, Dict, Optional

import numpy as np
import structlog

from app.infrastructure.ai.activity_detection.yolo_detector import (
    yolo_detector, COCO_CELL_PHONE_CLASS_ID,
)

logger = structlog.get_logger(__name__)


class PhoneDetector:
    """
    Wraps YOLODetector, filtering results to phone-usage relevant detections.
    """

    def __init__(self, confidence_threshold: float = 0.45) -> None:
        self.confidence_threshold = confidence_threshold

    def detect(self, frame_bgr: np.ndarray) -> List[Dict]:
        """
        Return list of cell-phone detections in this frame.
        Each dict: {class_name, confidence, box}
        """
        detections = yolo_detector.detect(frame_bgr, conf=self.confidence_threshold)
        phones = [
            d for d in detections
            if d["class_id"] == COCO_CELL_PHONE_CLASS_ID
        ]
        return phones

    def is_phone_present(self, frame_bgr: np.ndarray) -> Optional[Dict]:
        """
        Convenience: return the highest-confidence phone detection, or None.
        """
        phones = self.detect(frame_bgr)
        if not phones:
            return None
        return max(phones, key=lambda d: d["confidence"])


# Module-level default instance
phone_detector = PhoneDetector(confidence_threshold=0.45)
