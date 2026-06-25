"""
app/api/schemas/auth.py
-----------------------
Pydantic schemas for authentication endpoints.
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.core.constants import UserRole


class LoginRequest(BaseModel):
    """Request body for POST /auth/login"""
    username: str
    password: str


class TokenResponse(BaseModel):
    """Response for successful login"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshRequest(BaseModel):
    """Request body for POST /auth/refresh"""
    refresh_token: str


class UserResponse(BaseModel):
    """Response for GET /auth/me"""
    id: str
    username: str
    full_name: Optional[str]
    email: str
    role: UserRole
    is_active: bool

    class Config:
        from_attributes = True
