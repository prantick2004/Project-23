"""
Camera Stream WebSocket route — ws://host/ws/stream/{camera_id}
Pulls the latest frame from the existing CameraStreamManager singleton
(same source as the /snapshot REST endpoint), encodes to JPEG, and pushes
it to the connected client in a loop at ~15 FPS until disconnect.

No new camera-reading logic — reuses Phase 3's stream_manager entirely.
"""
import asyncio
import cv2
import structlog
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.infrastructure.camera.stream_manager import stream_manager
from app.api.websockets.connection_manager import connection_manager

logger = structlog.get_logger(__name__)

router = APIRouter()

FRAME_INTERVAL_SECONDS = 1 / 15  # ~15 FPS


@router.websocket("/ws/stream/{camera_id}")
async def websocket_camera_stream(websocket: WebSocket, camera_id: str) -> None:
    """
    Live JPEG-over-WebSocket stream for a single camera.
    Client must have already started the camera via POST /cameras/{id}/start.
    Sends raw JPEG bytes as binary WebSocket messages.
    """
    await connection_manager.connect(camera_id, websocket)

    try:
        while True:
            frame = stream_manager.get_frame(camera_id)

            if frame is None:
                # Camera not running or no frame yet — wait and retry
                await asyncio.sleep(FRAME_INTERVAL_SECONDS)
                continue

            success, buffer = cv2.imencode(".jpg", frame)
            if not success:
                await asyncio.sleep(FRAME_INTERVAL_SECONDS)
                continue

            await websocket.send_bytes(buffer.tobytes())
            await asyncio.sleep(FRAME_INTERVAL_SECONDS)

    except WebSocketDisconnect:
        logger.info("ws_stream_client_left", camera_id=camera_id)
    except Exception as e:
        logger.error("ws_stream_error", camera_id=camera_id, error=str(e))
    finally:
        connection_manager.disconnect(camera_id, websocket)
