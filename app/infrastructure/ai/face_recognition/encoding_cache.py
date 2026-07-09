"""
EncodingCache -- thread-safe in-memory cache of employee face encodings.

Loaded once at startup from the face_encodings table, refreshed whenever
POST /employees/{id}/encode runs. The live camera recognition loop reads
this cache directly -- never hits the DB per-frame.
"""
import threading
from typing import Dict, List
import uuid

import numpy as np
import structlog

logger = structlog.get_logger(__name__)


class EncodingCache:
    """
    Singleton, thread-safe. Use the module-level `encoding_cache` instance.

    Internal shape: { employee_id_str: [np.ndarray(128,), np.ndarray(128,), ...] }
    An employee can have multiple encodings (different photos/angles) --
    the recognizer compares against all of them and takes the best match.
    """

    def __init__(self) -> None:
        self._cache: Dict[str, List[np.ndarray]] = {}
        self._lock = threading.RLock()

    def set_employee_encodings(
        self,
        employee_id: uuid.UUID,
        encodings: List[np.ndarray],
    ) -> None:
        """Replace all cached encodings for one employee (used by refresh)."""
        with self._lock:
            self._cache[str(employee_id)] = list(encodings)
        logger.info(
            "encoding_cache_updated",
            employee_id=str(employee_id),
            count=len(encodings),
        )

    def remove_employee(self, employee_id: uuid.UUID) -> None:
        """Drop all cached encodings for one employee (e.g. on termination)."""
        with self._lock:
            self._cache.pop(str(employee_id), None)
        logger.info("encoding_cache_removed", employee_id=str(employee_id))

    def get_all(self) -> Dict[str, List[np.ndarray]]:
        """
        Snapshot copy of the full cache for the recognizer to compare against.
        Returns a shallow copy so callers don't hold the lock during comparison.
        """
        with self._lock:
            return dict(self._cache)

    def load_bulk(self, data: Dict[str, List[np.ndarray]]) -> None:
        """Replace the entire cache at once (used at startup)."""
        with self._lock:
            self._cache = dict(data)
        logger.info("encoding_cache_bulk_loaded", employees=len(data))

    @property
    def employee_count(self) -> int:
        with self._lock:
            return len(self._cache)

    @property
    def total_encodings(self) -> int:
        with self._lock:
            return sum(len(v) for v in self._cache.values())


# Module-level singleton -- import this everywhere
encoding_cache = EncodingCache()
