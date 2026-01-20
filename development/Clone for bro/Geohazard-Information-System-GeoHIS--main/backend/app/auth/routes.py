"""
Authentication Routes for GeoHIS

Provides endpoints for user registration, login, token refresh, and profile management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from app.database import get_db
from .models import User, RefreshToken, UserRole
from .schemas import (
    UserCreate, UserResponse, UserUpdate, Token, TokenRefresh,
    AuthResponse, MessageResponse, PasswordChange
)
from .utils import (
    get_password_hash, verify_password, create_access_token,
    create_refresh_token, decode_token, get_token_expiry,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from .dependencies import get_current_active_user, require_admin

router = APIRouter(prefix="/auth", tags=["authentication"])


# ============== Registration & Login ==============

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user account.
    
    - **email**: Valid email address (unique)
    - **password**: Minimum 8 characters
    - **full_name**: Optional display name
    - **role**: User role (default: viewer)
    """
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role,
        is_active=True,
        is_verified=False  # Email verification could be added later
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Generate tokens
    token_data = {"sub": str(user.id), "role": user.role.value}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    # Store refresh token
    db_refresh_token = RefreshToken(
        token=refresh_token,
        user_id=user.id,
        expires_at=get_token_expiry("refresh")
    )
    db.add(db_refresh_token)
    db.commit()
    
    return AuthResponse(
        user=UserResponse.model_validate(user),
        tokens=Token(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    )


@router.post("/login", response_model=AuthResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Login with email and password.
    
    Uses OAuth2 password flow for compatibility with OpenAPI.
    - **username**: Email address
    - **password**: Account password
    """
    # Find user by email
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Generate tokens
    token_data = {"sub": str(user.id), "role": user.role.value}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    # Store refresh token
    db_refresh_token = RefreshToken(
        token=refresh_token,
        user_id=user.id,
        expires_at=get_token_expiry("refresh")
    )
    db.add(db_refresh_token)
    db.commit()
    
    return AuthResponse(
        user=UserResponse.model_validate(user),
        tokens=Token(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(token_data: TokenRefresh, db: Session = Depends(get_db)):
    """
    Refresh access token using refresh token.
    
    - **refresh_token**: Valid refresh token from login/register
    """
    # Decode refresh token
    payload = decode_token(token_data.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Check if refresh token exists in database and is valid
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token == token_data.refresh_token
    ).first()
    
    if not db_token or not db_token.is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired or revoked"
        )
    
    # Get user
    user = db_token.user
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )
    
    # Revoke old refresh token
    db_token.is_revoked = True
    
    # Generate new tokens
    new_token_data = {"sub": str(user.id), "role": user.role.value}
    new_access_token = create_access_token(new_token_data)
    new_refresh_token = create_refresh_token(new_token_data)
    
    # Store new refresh token
    new_db_token = RefreshToken(
        token=new_refresh_token,
        user_id=user.id,
        expires_at=get_token_expiry("refresh")
    )
    db.add(new_db_token)
    db.commit()
    
    return Token(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    token_data: TokenRefresh,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Logout and revoke refresh token.
    
    - **refresh_token**: Refresh token to revoke
    """
    # Find and revoke refresh token
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token == token_data.refresh_token,
        RefreshToken.user_id == current_user.id
    ).first()
    
    if db_token:
        db_token.is_revoked = True
        db.commit()
    
    return MessageResponse(message="Successfully logged out")


# ============== Profile Management ==============

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    """Get the current authenticated user's profile."""
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
async def update_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update the current user's profile."""
    if user_update.email and user_update.email != current_user.email:
        # Check if new email is already taken
        existing = db.query(User).filter(User.email == user_update.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        current_user.email = user_update.email
        current_user.is_verified = False  # Require re-verification
    
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    
    db.commit()
    db.refresh(current_user)
    
    return UserResponse.model_validate(current_user)


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Change the current user's password."""
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    
    # Revoke all refresh tokens (force re-login on other devices)
    db.query(RefreshToken).filter(
        RefreshToken.user_id == current_user.id
    ).update({"is_revoked": True})
    
    db.commit()
    
    return MessageResponse(message="Password changed successfully")


# ============== Admin Routes ==============

@router.get("/users", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all users (admin only)."""
    users = db.query(User).offset(skip).limit(limit).all()
    return [UserResponse.model_validate(u) for u in users]


@router.put("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: str,
    role: UserRole,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update a user's role (admin only)."""
    from uuid import UUID
    
    try:
        user = db.query(User).filter(User.id == UUID(user_id)).first()
    except ValueError:
        raise HTTPException(status_code=404, detail="Invalid user ID")
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = role
    db.commit()
    db.refresh(user)
    
    return UserResponse.model_validate(user)


@router.put("/users/{user_id}/status", response_model=UserResponse)
async def update_user_status(
    user_id: str,
    is_active: bool,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Enable or disable a user account (admin only)."""
    from uuid import UUID
    
    try:
        user = db.query(User).filter(User.id == UUID(user_id)).first()
    except ValueError:
        raise HTTPException(status_code=404, detail="Invalid user ID")
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot disable your own account"
        )
    
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    
    return UserResponse.model_validate(user)
