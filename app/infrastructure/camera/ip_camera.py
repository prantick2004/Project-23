"""
IP camera implementation — wraps cv2.VideoCapture(http/https URL).
Not used yet (laptop webcam only for now) — ready for future swap,
zero changes needed in service layer when activated.
"""
import cv2
import numpy as np
from typing import Optional

from app.infrastructure.camera.base_camera import BaseCameraStream


class IPCameraStream(BaseCameraStream):
    """IP camera via OpenCV VideoCapture with an HTTP(S) stream URL."""

    def __init__(self, connection_string: str, camera_code: str) -> None:
        super().__init__(connection_string, camera_code)
        self.cap: Optional[cv2.VideoCapture] = None

    def connect(self) -> bool:
        self.cap = cv2.VideoCapture(self.connection_string)
        self.is_connected = self.cap.isOpened()
        return self.is_connected

    def read_frame(self) -> Optional[np.ndarray]:
        if not self.cap or not self.cap.isOpened():
            return None
        success, frame = self.cap.read()
        return frame if success else None

    def release(self) -> None:
        if self.cap:
            self.cap.release()
        self.is_connected = False

    def is_opened(self) -> bool:
        return bool(self.cap and self.cap.isOpened())
