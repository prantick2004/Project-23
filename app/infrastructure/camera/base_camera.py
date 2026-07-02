"""
Abstract base class for all camera stream types.
USB / IP / RTSP / CCTV each implement this same interface.
Service layer and StreamManager only ever talk to this interface —
never to a concrete subclass directly (Strategy pattern).
"""
from abc import ABC, abstractmethod
from typing import Optional
import numpy as np


class BaseCameraStream(ABC):
    """
    Common interface every camera type must implement.

    Lifecycle: connect() -> read_frame() repeatedly -> release()
    """

    def __init__(self, connection_string: str, camera_code: str) -> None:
        self.connection_string = connection_string
        self.camera_code = camera_code
        self.is_connected: bool = False

    @abstractmethod
    def connect(self) -> bool:
        """Open the camera/stream connection. Returns True on success."""
        raise NotImplementedError

    @abstractmethod
    def read_frame(self) -> Optional[np.ndarray]:
        """Read one frame. Returns None if read failed or not connected."""
        raise NotImplementedError

    @abstractmethod
    def release(self) -> None:
        """Release the underlying camera/stream resource."""
        raise NotImplementedError

    @abstractmethod
    def is_opened(self) -> bool:
        """True if the underlying capture device is currently open."""
        raise NotImplementedError
