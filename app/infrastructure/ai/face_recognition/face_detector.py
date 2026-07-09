"""
FaceDetector -- wraps face_recognition's dlib-based face location detector.
Returns bounding boxes only. Encoding is a separate step (face_encoder.py).
"""
from typing import List, Tuple

import numpy as np
import face_recognition
import structlog

logger = structlog.get_logger(__name__)

# (top, right, bottom, left) -- face_recognition's box format
BoundingBox = Tuple[int, int, int, int]


class FaceDetector:
    """
    Detects face locations in a BGR (OpenCV) frame.

    model="hog"  -> fast, CPU-friendly, good enough for live camera streams.
    model="cnn"  -> more accurate, much slower without GPU. Use only for
                    one-off encoding-generation from uploaded photos, not
                    for the per-frame live camera loop.
    """

    def __init__(self, model: str = "hog", upsample: int = 1) -> None:
        self.model = model
        self.upsample = upsample

    def detect(self, frame_bgr: np.ndarray) -> List[BoundingBox]:
        """
        Detect all faces in a single frame.

        Args:
            frame_bgr: OpenCV frame, BGR channel order (as read by cv2.VideoCapture).

        Returns:
            List of (top, right, bottom, left) bounding boxes, one per face found.
        """
        # face_recognition expects RGB, OpenCV gives BGR -- convert
        rgb_frame = np.ascontiguousarray(frame_bgr[:, :, ::-1])

        try:
            boxes = face_recognition.face_locations(
                rgb_frame,
                number_of_times_to_upsample=self.upsample,
                model=self.model,
            )
        except Exception as e:
            logger.error("face_detection_failed", error=str(e))
            return []

        return boxes

    def detect_largest(self, frame_bgr: np.ndarray) -> BoundingBox | None:
        """
        Convenience: detect all faces, return only the largest box
        (closest/most prominent face). Useful for single-employee photo
        uploads where exactly one face is expected.
        """
        boxes = self.detect(frame_bgr)
        if not boxes:
            return None

        def area(box: BoundingBox) -> int:
            top, right, bottom, left = box
            return (bottom - top) * (right - left)

        return max(boxes, key=area)


# Module-level default instance -- HOG model, good for live camera loop
face_detector = FaceDetector(model="hog", upsample=1)
