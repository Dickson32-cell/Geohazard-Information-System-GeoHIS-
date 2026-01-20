"""
Authentication Tests for GeoHIS

Tests user registration, login, token refresh, and profile management.
"""

import pytest
from fastapi import status


class TestRegistration:
    """Tests for user registration."""
    
    def test_register_user_success(self, client, test_user_data):
        """Test successful user registration."""
        response = client.post("/api/v1/auth/register", json=test_user_data)
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        
        assert "user" in data
        assert "tokens" in data
        assert data["user"]["email"] == test_user_data["email"]
        assert data["user"]["full_name"] == test_user_data["full_name"]
        assert data["user"]["role"] == "viewer"
        assert data["tokens"]["access_token"]
        assert data["tokens"]["refresh_token"]
        assert data["tokens"]["token_type"] == "bearer"
    
    def test_register_duplicate_email(self, client, test_user_data):
        """Test registration fails with duplicate email."""
        # First registration
        client.post("/api/v1/auth/register", json=test_user_data)
        
        # Second registration with same email
        response = client.post("/api/v1/auth/register", json=test_user_data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already registered" in response.json()["detail"]
    
    def test_register_invalid_email(self, client):
        """Test registration fails with invalid email."""
        response = client.post("/api/v1/auth/register", json={
            "email": "invalid-email",
            "password": "testpassword123"
        })
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_register_short_password(self, client):
        """Test registration fails with short password."""
        response = client.post("/api/v1/auth/register", json={
            "email": "test@example.com",
            "password": "short"
        })
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestLogin:
    """Tests for user login."""
    
    def test_login_success(self, client, test_user_data):
        """Test successful login."""
        # Register first
        client.post("/api/v1/auth/register", json=test_user_data)
        
        # Login
        response = client.post("/api/v1/auth/login", data={
            "username": test_user_data["email"],
            "password": test_user_data["password"]
        })
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "user" in data
        assert "tokens" in data
        assert data["tokens"]["access_token"]
    
    def test_login_wrong_password(self, client, test_user_data):
        """Test login fails with wrong password."""
        client.post("/api/v1/auth/register", json=test_user_data)
        
        response = client.post("/api/v1/auth/login", data={
            "username": test_user_data["email"],
            "password": "wrongpassword"
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_login_nonexistent_user(self, client):
        """Test login fails for nonexistent user."""
        response = client.post("/api/v1/auth/login", data={
            "username": "nonexistent@example.com",
            "password": "password123"
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestTokenRefresh:
    """Tests for token refresh."""
    
    def test_refresh_token_success(self, client, registered_user):
        """Test successful token refresh."""
        refresh_token = registered_user["tokens"]["refresh_token"]
        
        response = client.post("/api/v1/auth/refresh", json={
            "refresh_token": refresh_token
        })
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["access_token"]
        assert data["refresh_token"] != refresh_token  # New token issued
    
    def test_refresh_invalid_token(self, client):
        """Test refresh fails with invalid token."""
        response = client.post("/api/v1/auth/refresh", json={
            "refresh_token": "invalid-token"
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestProfile:
    """Tests for profile management."""
    
    def test_get_profile(self, client, auth_headers, test_user_data):
        """Test getting current user profile."""
        response = client.get("/api/v1/auth/me", headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == test_user_data["email"]
    
    def test_get_profile_unauthenticated(self, client):
        """Test profile access fails without authentication."""
        response = client.get("/api/v1/auth/me")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_update_profile(self, client, auth_headers):
        """Test updating user profile."""
        response = client.put("/api/v1/auth/me", 
            headers=auth_headers,
            json={"full_name": "Updated Name"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["full_name"] == "Updated Name"
    
    def test_change_password(self, client, auth_headers, test_user_data):
        """Test changing password."""
        response = client.post("/api/v1/auth/change-password",
            headers=auth_headers,
            json={
                "current_password": test_user_data["password"],
                "new_password": "newpassword123"
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["success"]
