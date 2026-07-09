"""
FaceRecognizer -- compares a live face encoding against the EncodingCache
and returns the best matching employee, or None if no match clears the
confidence threshold (i.e. unknown person).
"""
from dataclasses import dataclass
from typing import Optional
import uuid

import numpy as np
import face_recognition
import structlog

from app.infrastructure.ai.face_recognition.encoding_cache import encoding_cache

logger = structlog.get_logger(__name__)

# Lower distance = more similar face. face_recognition's own docs suggest
# 0.6 as a reasonable cutoff; below this the recognizer flags "unknown".
# Mirrors system_settings.recognition.confidence_threshold from the
# Architecture doc (0.55 similarity ~= 0.45 distance-ish -- tuned below
# in distance space directly, simpler and matches face_recognition's API).
DEFAULT_MAX_DISTANCE = 0.6


@dataclass
class RecognitionResult:
    """Outcome of comparing one live face encoding against the cache."""
    employee_id: Optional[uuid.UUID]
    confidence: float          # 0.0-1.0, higher = more confident match
    distance: float            # raw face-distance, lower = more similar
    is_match: bool             # False => unknown person


class FaceRecognizer:
    """
    Stateless comparator -- reads from the global encoding_cache singleton
    on every call, so it always sees the latest cached encodings without
    needing its own refresh logic.
    """

    def __init__(self, max_distance: float = DEFAULT_MAX_DISTANCE) -> None:
        self.max_distance = max_distance

    def recognize(self, live_encoding: np.ndarray) -> RecognitionResult:
        """
        Compare one live encoding against every cached employee's encodings.
        For employees with multiple encodings, the minimum (best) distance
        among their encodings is used.

        Returns:
            RecognitionResult with is_match=True and employee_id set if a
            confident match was found, otherwise is_match=False with
            employee_id=None.
        """
        cache = encoding_cache.get_all()

        if not cache:
            return RecognitionResult(
                employee_id=None, confidence=0.0, distance=1.0, is_match=False
            )

        best_employee_id: Optional[str] = None
        best_distance = float("inf")

        for employee_id_str, encodings in cache.items():
            if not encodings:
                continue
            distances = face_recognition.face_distance(encodings, live_encoding)
            min_dist = float(np.min(distances))
            if min_dist < best_distance:
                best_distance = min_dist
                best_employee_id = employee_id_str

        if best_employee_id is None or best_distance > self.max_distance:
            return RecognitionResult(
                employee_id=None,
                confidence=round(max(0.0, 1.0 - best_distance), 3) if best_employee_id else 0.0,
                distance=round(best_distance, 4) if best_employee_id else 1.0,
                is_match=False,
            )

        confidence = round(max(0.0, 1.0 - best_distance), 3)
        return RecognitionResult(
            employee_id=uuid.UUID(best_employee_id),
            confidence=confidence,
            distance=round(best_distance, 4),
            is_match=True,
        )


# Module-level default instance
face_recognizer = FaceRecognizer()
