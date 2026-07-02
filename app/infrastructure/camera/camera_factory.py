"""
Camera Factory — creates the correct BaseCameraStream subclass
based on camera_type. Callers never instantiate camera classes directly.
"""
from app.infrastructure.camera.base_camera import BaseCameraStream
from app.infrastructure.camera.usb_camera import USBCameraStream
from app.infrastructure.camera.ip_camera import IPCameraStream
from app.infrastructure.camera.rtsp_camera import RTSPCameraStream
from app.core.constants import CameraType


class CameraFactory:
    """Builds the right camera stream object from camera_type + connection_string."""

    @staticmethod
    def create_camera(camera_type: str, connection_string: str, camera_code: str) -> BaseCameraStream:
        """
        camera_type: one of CameraType enum values ("usb", "ip", "rtsp", "cctv")
        connection_string: "0" for USB index, URL for ip/rtsp/cctv
        """
        camera_type = camera_type.lower()

        if camera_type == CameraType.USB.value:
            return USBCameraStream(connection_string, camera_code)

        if camera_type == CameraType.IP.value:
            return IPCameraStream(connection_string, camera_code)

        if camera_type in (CameraType.RTSP.value, CameraType.CCTV.value):
            # CCTV typically also speaks RTSP — same handler
            return RTSPCameraStream(connection_string, camera_code)

        raise ValueError(f"Unsupported camera_type: '{camera_type}'")
