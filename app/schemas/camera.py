"""
Camera Pydantic schemas — request/response validation.
"""
from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class CameraCreate(BaseModel):
    camera_code: str
    name: str
    camera_type: str          # "usb" | "ip" | "rtsp" | "cctv"
    connection_string: str    # "0" for USB index, URL for others
    location: Optional[str] = None
    is_active: Optional[bool] = True
    resolution_width: Optional[int] = 1280
    resolution_height: Optional[int] = 720
    fps_target: Optional[int] = 15
    is_attendance_cam: Optional[bool] = False
    is_activity_cam: Optional[bool] = True
    zone_config: Optional[dict] = None


class CameraUpdate(BaseModel):
    name: Optional[str] = None
    connection_string: Optional[str] = None
    location: Optional[str] = None
    is_active: Optional[bool] = None
    resolution_width: Optional[int] = None
    resolution_height: Optional[int] = None
    fps_target: Optional[int] = None
    is_attendance_cam: Optional[bool] = None
    is_activity_cam: Optional[bool] = None
    zone_config: Optional[dict] = None


class CameraResponse(BaseModel):
    id: UUID
    camera_code: str
    name: str
    camera_type: str
    connection_string: str
    location: Optional[str]
    is_active: bool
    status: str
    resolution_width: int
    resolution_height: int
    fps_target: int
    is_attendance_cam: bool
    is_activity_cam: bool
    zone_config: Optional[dict]
    last_heartbeat: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class CameraListResponse(BaseModel):
    total: int
    cameras: list[CameraResponse]


class CameraStreamActionResponse(BaseModel):
    camera_id: str
    status: str
    message: str


class CameraStatusResponse(BaseModel):
    camera_id: str
    camera_code: str
    db_status: str
    is_streaming: bool
    last_heartbeat: Optional[str]
