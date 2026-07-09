"""
FaceEncoder -- generates 128-d face encoding vectors from a frame + bounding box.
Encoding = numeric "fingerprint" of a face, comparable via Euclidean distance.
"""
from typing import List, Optional

import numpy as np
import face_recognition
import structlog

from app.infrastructure.ai.face_recognition.face_detector import BoundingBox

logger = structlog.get_logger(__name__)


class FaceEncoder:
    """
    Generates 128-d encoding vectors for detected face regions.
    Output dtype is float64, shape (128,) -- matches the BYTEA column
    in face_encodings table via numpy.tobytes() / numpy.frombuffer().
    """

    def __init__(self, num_jitters: int = 1) -> None:
        # num_jitters: how many times to re-sample the face for a more
        # robust encoding. 1 = fast (live use). Use higher (e.g. 5-10)
        # only for one-off encoding generation from uploaded photos.
        self.num_jitters = num_jitters

    def encode(
        self,
        frame_bgr: np.ndarray,
        box: BoundingBox,
    ) -> Optional[np.ndarray]:
        """
        Generate a single 128-d encoding for one face location in a frame.

        Args:
            frame_bgr: OpenCV frame, BGR channel order.
            box: (top, right, bottom, left) bounding box from FaceDetector.

        Returns:
            np.ndarray shape (128,) dtype float64, or None on failure.
        """
        rgb_frame = np.ascontiguousarray(frame_bgr[:, :, ::-1])

        try:
            encodings = face_recognition.face_encodings(
                rgb_frame,
                known_face_locations=[box],
                num_jitters=self.num_jitters,
            )
        except Exception as e:
            logger.error("face_encoding_failed", error=str(e))
            return None

        if not encodings:
            return None

        return encodings[0]

    def encode_all(
        self,
        frame_bgr: np.ndarray,
        boxes: List[BoundingBox],
    ) -> List[np.ndarray]:
        """Generate encodings for multiple face locations in one frame."""
        rgb_frame = np.ascontiguousarray(frame_bgr[:, :, ::-1])

        try:
            encodings = face_recognition.face_encodings(
                rgb_frame,
                known_face_locations=boxes,
                num_jitters=self.num_jitters,
            )
        except Exception as e:
            logger.error("face_encoding_batch_failed", error=str(e))
            return []

        return encodings

    @staticmethod
    def quality_score(encoding: np.ndarray, box: BoundingBox) -> float:
        """
        Rough quality heuristic (0.0-1.0) based on face box size relative
        to a reasonable minimum. Larger detected face = more reliable
        encoding. Stored alongside the encoding in face_encodings.quality_score.
        """
        top, right, bottom, left = box
        face_area = (bottom - top) * (right - left)
        # 10000 px^2 (~100x100) treated as a solid minimum face size
        score = min(1.0, face_area / 10000.0)
        return round(score, 3)


# Module-level default instance -- 1 jitter, fast, for live camera loop
face_encoder = FaceEncoder(num_jitters=1)

# Separate instance for one-off, higher-quality encoding from uploaded photos
face_encoder_hq = FaceEncoder(num_jitters=5)
