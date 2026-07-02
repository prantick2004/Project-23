"""
USB camera implementation — wraps cv2.VideoCapture(int index).
Used for laptop webcam (index 0) and any USB-connected camera.
"""
import cv2
import numpy as np
from typing import Optional

from app.infrastructure.camera.base_camera import BaseCameraStream


class USBCameraStream(BaseCameraStream):
    """
    USB camera via OpenCV VideoCapture.
    connection_string is expected to be a device index as string, e.g. "0".
    """

    def __init__(self, connection_string: str, camera_code: str) -> None:
        super().__init__(connection_string, camera_code)
        self.cap: Optional[cv2.VideoCapture] = None

    def connect(self) -> bool:
        try:
            device_index = int(self.connection_string)
        except ValueError:
            device_index = 0  # fallback to default webcam

        self.cap = cv2.VideoCapture(device_index)
        self.is_connected = self.cap.isOpened()
        return self.is_connected

    def read_frame(self) -> Optional[np.ndarray]:
        if not self.cap or not self.cap.isOpened():
            return None
        success, frame = self.cap.read()
        if not success:
            return None
        return frame

    def release(self) -> None:
        if self.cap:
            self.cap.release()
        self.is_connected = False

    def is_opened(self) -> bool:
        return bool(self.cap and self.cap.isOpened())
