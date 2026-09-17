"""
FaceEncodingService — generates face encodings from an employee's stored
photo, persists them, and keeps the in-memory EncodingCache in sync.
"""
import cv2
import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.employee_repository import EmployeeRepository
from app.repositories.face_encoding_repository import FaceEncodingRepository
from app.infrastructure.ai.face_recognition.face_detector import face_detector, FaceDetector
from app.infrastructure.ai.face_recognition.face_encoder import face_encoder_hq
from app.infrastructure.ai.face_recognition.encoding_cache import encoding_cache

# For one-off enrollment-photo encoding (this file), we can afford to try
# much harder than the live camera loop's fast hog/upsample=1 settings.
# Real-world testing against an actual laptop webcam selfie showed
# upsample=1 and upsample=2 both missed a clearly-visible, well-lit,
# in-focus face that upsample=3 (and the much slower CNN model) found
# immediately -- so this is a real retry ladder, not a single guess.
# The live camera loop (stream_manager.py) is unaffected; it still uses
# the fast default `face_detector` instance for per-frame detection.
_ENROLLMENT_UPSAMPLE_LADDER = [2, 3]
_enrollment_detectors = [
    FaceDetector(model="hog", upsample=n) for n in _ENROLLMENT_UPSAMPLE_LADDER
]


class FaceEncodingService:
    """Handles face-encoding generation and cache refresh for employees."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.employee_repo = EmployeeRepository(db)
        self.face_encoding_repo = FaceEncodingRepository(db)

    async def encode_employee(self, employee_id: str) -> dict:
        """
        Generate a face encoding from the employee's stored photo,
        deactivate old encodings, save the new one, refresh face_encoded
        flag, and update the in-memory EncodingCache.
        """
        employee = await self.employee_repo.get_by_id(employee_id)
        if not employee:
            raise ValueError("Employee not found")

        if not employee.photo_path:
            raise ValueError("Employee has no uploaded photo — upload a photo first")

        img = cv2.imread(employee.photo_path)
        if img is None:
            raise ValueError(f"Could not read photo file at '{employee.photo_path}'")

        box = face_detector.detect_largest(img)
        if box is None:
            # Retry with increasing upsample factors before giving up --
            # this is a one-off enrollment call, not the live per-frame
            # loop, so the extra latency here is fine and worth the
            # improved detection rate on smaller/off-center faces.
            for detector in _enrollment_detectors:
                box = detector.detect_largest(img)
                if box is not None:
                    break
        if box is None:
            raise ValueError("No face detected in employee's photo")

        encoding = face_encoder_hq.encode(img, box)
        if encoding is None:
            raise ValueError("Face encoding generation failed")

        quality = face_encoder_hq.quality_score(encoding, box)

        # Invalidate old encodings, save the new one
        await self.face_encoding_repo.deactivate_all_for_employee(employee_id)
        await self.face_encoding_repo.create_encoding(
            employee_id=employee_id,
            encoding_vector=encoding,
            image_path=employee.photo_path,
            quality_score=quality,
        )

        await self.employee_repo.update_face_encoded_status(employee_id, True)

        # Refresh this employee's slot in the live in-memory cache
        active = await self.face_encoding_repo.get_active_by_employee(employee_id)
        vectors = [np.frombuffer(e.encoding_vector, dtype=np.float64) for e in active]
        encoding_cache.set_employee_encodings(employee.id, vectors)

        return {
            "employee_id": str(employee_id),
            "face_encoded": True,
            "quality_score": quality,
            "message": "Face encoding generated and cached successfully",
        }

    async def refresh_cache_from_db(self) -> int:
        """
        Rebuild the ENTIRE in-memory EncodingCache from DB. Call at
        app startup so recognition works immediately after any restart
        (including uvicorn --reload) without re-running /encode.
        """
        grouped = await self.face_encoding_repo.get_all_active_grouped_by_employee()
        encoding_cache.load_bulk(grouped)
        return encoding_cache.total_encodings
