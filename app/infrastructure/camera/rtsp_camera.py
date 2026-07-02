"""
RTSP camera implementation — wraps cv2.VideoCapture(rtsp:// URL).
Includes basic reconnect-on-read-failure logic (RTSP streams drop often).
Not used yet — ready for future CCTV/RTSP swap.
"""
import cv2
import numpy as np
from typing import Optional

from app.infrastructure.camera.base_camera import BaseCameraStream


class RTSPCameraStream(BaseCameraStream):
    """RTSP camera via OpenCV VideoCapture with reconnect support."""

    def __init__(self, connection_string: str, camera_code: str) -> None:
        super().__init__(connection_string, camera_code)
        self.cap: Optional[cv2.VideoCapture] = None
        self._consecutive_failures: int = 0
        self._max_failures_before_reconnect: int = 5

    def connect(self) -> bool:
        self.cap = cv2.VideoCapture(self.connection_string)
        self.is_connected = self.cap.isOpened()
        self._consecutive_failures = 0
        return self.is_connected

    def read_frame(self) -> Optional[np.ndarray]:
        if not self.cap or not self.cap.isOpened():
            return None
        success, frame = self.cap.read()
        if not success:
            self._consecutive_failures += 1
            if self._consecutive_failures >= self._max_failures_before_reconnect:
                self.release()
                self.connect()
            return None
        self._consecutive_failures = 0
        return frame

    def release(self) -> None:
        if self.cap:
            self.cap.release()
        self.is_connected = False

    def is_opened(self) -> bool:
        return bool(self.cap and self.cap.isOpened())
