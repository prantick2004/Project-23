"""
ModelRegistry -- singleton that loads AI models once at process startup
and shares them across all camera threads.

Phase 5: warms up face_recognition's bundled dlib models (HOG detector,
68-point landmark predictor, ResNet face encoder) with one dummy pass.
dlib lazy-loads its model files on first real use -- doing this once at
startup avoids a multi-second stall on the first live camera frame.

Phase 6 will extend this to also load YOLOv8 weights.
"""
import threading

import numpy as np
import face_recognition
import structlog

logger = structlog.get_logger(__name__)


class ModelRegistry:
    """
    Thread-safe singleton. Use the module-level `model_registry` instance
    everywhere -- never instantiate ModelRegistry() directly elsewhere.
    """

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._loaded = False
            return cls._instance

    def load(self) -> None:
        """Warm up dlib's face detection model. Safe to call multiple times."""
        if self._loaded:
            return

        logger.info("model_registry_loading")
        dummy_frame = np.zeros((100, 100, 3), dtype=np.uint8)
        face_recognition.face_locations(dummy_frame, model="hog")
        self._loaded = True
        logger.info("model_registry_loaded")

    @property
    def is_loaded(self) -> bool:
        return self._loaded


# Module-level singleton -- import this everywhere
model_registry = ModelRegistry()
