"""
Phase 3 sanity test — confirms USBCameraStream + CameraFactory + CameraStreamManager
work end-to-end with the real laptop webcam before repository/service/router layers
are built on top.
"""
import time
import cv2

from app.infrastructure.camera.stream_manager import stream_manager

CAMERA_ID = "test-cam-001"
CAMERA_TYPE = "usb"
CONNECTION_STRING = "0"  # laptop webcam index
CAMERA_CODE = "CAM-TEST"


def main() -> None:
    print("Starting camera...")
    started = stream_manager.start_camera(CAMERA_ID, CAMERA_TYPE, CONNECTION_STRING, CAMERA_CODE)

    if not started:
        print("FAILED: camera could not connect. Check /dev/video0 permissions.")
        return

    print("Camera started. Waiting 2s for frames to buffer...")
    time.sleep(2)

    frame = stream_manager.get_frame(CAMERA_ID)

    if frame is None:
        print("FAILED: no frame captured after 2s.")
    else:
        output_path = "scripts/test_frame.jpg"
        cv2.imwrite(output_path, frame)
        print(f"SUCCESS: frame captured, shape={frame.shape}, saved to {output_path}")

    stream_manager.stop_camera(CAMERA_ID)
    print("Camera stopped.")


if __name__ == "__main__":
    main()
