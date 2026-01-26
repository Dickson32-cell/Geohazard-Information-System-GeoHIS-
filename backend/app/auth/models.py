"""
User and Authentication Models for GeoHIS

Provides database models for user accounts and refresh tokens.
"""

from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
import uuid

from app.models.models import Base, User
from app.config import settings

# Determine ID type based on database
is_sqlite = settings.database_url.startswith("sqlite")
ID_TYPE = String(36) if is_sqlite else UUID(as_uuid=True)
DEFAULT_ID = str(uuid.uuid4()) if is_sqlite else uuid.uuid4


class UserRole(str, enum.Enum):
    """User role enumeration for access control."""
    admin = "admin"              # Full system access
    planner = "planner"          # Municipal planner - can view/analyze
    viewer = "viewer"            # Public viewer - read-only access
    

# User model is now imported from app.models.models


class RefreshToken(Base):
    """Refresh token model for JWT token rotation."""
    __tablename__ = "refresh_tokens"
    
    id = Column(ID_TYPE, primary_key=True, default=DEFAULT_ID)
    token = Column(String(500), unique=True, nullable=False, index=True)
    user_id = Column(ID_TYPE, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    is_revoked = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="refresh_tokens")
    
    @property
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at
    
    @property
    def is_valid(self) -> bool:
        return not self.is_revoked and not self.is_expired
