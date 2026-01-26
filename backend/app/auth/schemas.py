"""
Authentication Schemas for GeoHIS

Pydantic schemas for user registration, login, and token responses.
"""

import re
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID
from .models import UserRole


# Password complexity requirements
PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 100
PASSWORD_PATTERN = re.compile(
    r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]'
)


def validate_password_complexity(password: str) -> str:
    """
    Validate password meets complexity requirements.
    
    Requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character (@$!%*?&)
    """
    if len(password) < PASSWORD_MIN_LENGTH:
        raise ValueError(f"Password must be at least {PASSWORD_MIN_LENGTH} characters")
    if len(password) > PASSWORD_MAX_LENGTH:
        raise ValueError(f"Password must be at most {PASSWORD_MAX_LENGTH} characters")
    if not re.search(r'[a-z]', password):
        raise ValueError("Password must contain at least one lowercase letter")
    if not re.search(r'[A-Z]', password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not re.search(r'\d', password):
        raise ValueError("Password must contain at least one digit")
    if not re.search(r'[@$!%*?&]', password):
        raise ValueError("Password must contain at least one special character (@$!%*?&)")
    return password


# ============== User Schemas ==============

class UserBase(BaseModel):
    """Base user schema with common fields."""
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    """Schema for user registration with password complexity validation."""
    password: str = Field(..., min_length=8, max_length=100)
    role: UserRole = UserRole.viewer
    
    @field_validator('password')
    @classmethod
    def password_complexity(cls, v: str) -> str:
        """Validate password meets complexity requirements."""
        return validate_password_complexity(v)


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """Schema for updating user profile."""
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


class UserResponse(UserBase):
    """Schema for user response (excludes password)."""
    id: UUID
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class UserInDB(UserResponse):
    """Schema for user with hashed password (internal use)."""
    hashed_password: str


# ============== Token Schemas ==============

class Token(BaseModel):
    """Schema for access/refresh token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # Seconds until access token expires


class TokenRefresh(BaseModel):
    """Schema for token refresh request."""
    refresh_token: str


class TokenPayload(BaseModel):
    """Schema for decoded token payload."""
    sub: str  # User ID
    exp: int  # Expiration timestamp
    type: str  # "access" or "refresh"
    role: str  # User role


# ============== Auth Response Schemas ==============

class AuthResponse(BaseModel):
    """Schema for authentication response with user and tokens."""
    user: UserResponse
    tokens: Token


class MessageResponse(BaseModel):
    """Schema for simple message responses."""
    message: str
    success: bool = True


class PasswordChange(BaseModel):
    """Schema for password change request with complexity validation."""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)
    
    @field_validator('new_password')
    @classmethod
    def password_complexity(cls, v: str) -> str:
        """Validate new password meets complexity requirements."""
        return validate_password_complexity(v)


class PasswordReset(BaseModel):
    """Schema for password reset request."""
    email: EmailStr
