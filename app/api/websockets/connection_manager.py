"""
WebSocket Connection Manager — tracks active client connections per camera_id.
Allows multiple clients to subscribe to the same camera stream simultaneously.
"""
from typing import Dict, Set
from fastapi import WebSocket
import structlog

logger = structlog.get_logger(__name__)


class ConnectionManager:
    """
    Singleton registry of active WebSocket connections, grouped by camera_id.
    Use the module-level `connection_manager` instance everywhere.
    """

    def __init__(self) -> None:
        # camera_id -> set of connected WebSocket clients
        self._connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, camera_id: str, websocket: WebSocket) -> None:
        """Accept a new WebSocket connection and register it under camera_id."""
        await websocket.accept()
        if camera_id not in self._connections:
            self._connections[camera_id] = set()
        self._connections[camera_id].add(websocket)
        logger.info(
            "ws_client_connected",
            camera_id=camera_id,
            active_clients=len(self._connections[camera_id]),
        )

    def disconnect(self, camera_id: str, websocket: WebSocket) -> None:
        """Remove a WebSocket connection from the registry."""
        if camera_id in self._connections:
            self._connections[camera_id].discard(websocket)
            if not self._connections[camera_id]:
                del self._connections[camera_id]
        logger.info("ws_client_disconnected", camera_id=camera_id)

    def has_clients(self, camera_id: str) -> bool:
        """True if at least one client is subscribed to this camera_id."""
        return camera_id in self._connections and len(self._connections[camera_id]) > 0

    def client_count(self, camera_id: str) -> int:
        """Number of clients currently subscribed to this camera_id."""
        return len(self._connections.get(camera_id, set()))


# Module-level singleton — import this everywhere
connection_manager = ConnectionManager()
