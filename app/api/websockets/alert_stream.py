"""
Alert WebSocket — ws://host/ws/alerts?token=<jwt>
Global broadcast channel (not camera-scoped) — any connected dashboard
client receives every new alert as JSON. Separate registry from
connection_manager.py, which is keyed by camera_id for video streaming.
Requires a valid JWT passed as ?token=... query param (Phase 11).
"""
from typing import Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import structlog

from app.api.dependencies import get_ws_user

logger = structlog.get_logger(__name__)

router = APIRouter()


class AlertBroadcaster:
    """Singleton registry of clients subscribed to the global alert feed."""

    def __init__(self) -> None:
        self._clients: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._clients.add(websocket)
        logger.info("alert_ws_client_connected", active_clients=len(self._clients))

    def disconnect(self, websocket: WebSocket) -> None:
        self._clients.discard(websocket)
        logger.info("alert_ws_client_disconnected", active_clients=len(self._clients))

    async def broadcast(self, payload: dict) -> None:
        """Send a JSON payload to every connected client. Drops dead sockets silently."""
        dead = set()
        for client in self._clients:
            try:
                await client.send_json(payload)
            except Exception:
                dead.add(client)
        for d in dead:
            self._clients.discard(d)


# Module-level singleton — import this everywhere (mirrors connection_manager pattern)
alert_broadcaster = AlertBroadcaster()


@router.websocket("/ws/alerts")
async def alert_ws_endpoint(websocket: WebSocket):
    user = await get_ws_user(websocket)
    if user is None:
        return  # socket already closed by get_ws_user with 1008

    await alert_broadcaster.connect(websocket)
    try:
        while True:
            # Client doesn't need to send anything; just keep connection open.
            await websocket.receive_text()
    except WebSocketDisconnect:
        alert_broadcaster.disconnect(websocket)
