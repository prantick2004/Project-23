"""
YOLODetector -- thread-safe singleton wrapping YOLOv8n for object detection.
Loaded once at startup via ModelRegistry, shared across all camera threads.
Runs CPU inference (no GPU on this machine) -- yolov8n chosen for speed.
"""
import threading
from typing import List, Dict

import numpy as np
import structlog
from ultralytics import YOLO

logger = structlog.get_logger(__name__)

MODEL_PATH = "models/yolo/yolov8n.pt"

# COCO class IDs we actually care about for this project
COCO_PERSON_CLASS_ID = 0
COCO_CELL_PHONE_CLASS_ID = 67


class YOLODetector:
    """
    Thread-safe singleton. Use the module-level `yolo_detector` instance
    everywhere -- never instantiate YOLODetector() directly elsewhere.
    """

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._model = None
                cls._instance._loaded = False
            return cls._instance

    def load(self) -> None:
        """Load YOLOv8n weights from disk. Safe to call multiple times."""
        if self._loaded:
            return
        logger.info("yolo_detector_loading", path=MODEL_PATH)
        self._model = YOLO(MODEL_PATH)
        # Warm-up pass avoids a multi-second stall on first live frame
        dummy_frame = np.zeros((640, 640, 3), dtype=np.uint8)
        self._model.predict(dummy_frame, verbose=False)
        self._loaded = True
        logger.info("yolo_detector_loaded")

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    def detect(self, frame_bgr: np.ndarray, conf: float = 0.4) -> List[Dict]:
        """
        Run object detection on a single frame.

        Returns list of dicts: {class_id, class_name, confidence, box}
        box = [x1, y1, x2, y2] in pixel coordinates.
        """
        if not self._loaded or self._model is None:
            logger.warning("yolo_detect_called_before_load")
            return []

        try:
            results = self._model.predict(frame_bgr, conf=conf, verbose=False)
        except Exception as e:
            logger.error("yolo_detection_failed", error=str(e))
            return []

        detections: List[Dict] = []
        if not results:
            return detections

        result = results[0]
        for box in result.boxes:
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            detections.append({
                "class_id": class_id,
                "class_name": self._model.names.get(class_id, str(class_id)),
                "confidence": confidence,
                "box": [x1, y1, x2, y2],
            })
        return detections


# Module-level singleton -- import this everywhere
yolo_detector = YOLODetector()
