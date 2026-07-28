"""
Attendance WebSocket — ws://host/ws/attendance
Global broadcast channel (not camera-scoped) — pushes every check-in/
check-out event to connected dashboard clients in real time.
Mirrors alert_stream.py's AlertBroadcaster pattern exactly — separate
registry, not merged with connection_manager.py or AlertBroadcaster.
"""
from typing import Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import structlog

logger = structlog.get_logger(__name__)

router = APIRouter()


class AttendanceBroadcaster:
    """Singleton registry of clients subscribed to the global attendance feed."""

    def __init__(self) -> None:
        self._clients: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._clients.add(websocket)
        logger.info("attendance_ws_client_connected", active_clients=len(self._clients))

    def disconnect(self, websocket: WebSocket) -> None:
        self._clients.discard(websocket)
        logger.info("attendance_ws_client_disconnected", active_clients=len(self._clients))

    async def broadcast(self, payload: dict) -> None:
        dead = set()
        for client in self._clients:
            try:
                await client.send_json(payload)
            except Exception:
                dead.add(client)
        for d in dead:
            self._clients.discard(d)


# Module-level singleton — import this everywhere
attendance_broadcaster = AttendanceBroadcaster()


@router.websocket("/ws/attendance")
async def attendance_ws_endpoint(websocket: WebSocket):
    await attendance_broadcaster.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        attendance_broadcaster.disconnect(websocket)
