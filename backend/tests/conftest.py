"""
Test Configuration and Fixtures for GeoHIS

Provides shared fixtures for testing the GeoHIS backend.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import get_db
from app.models.models import Base
from app.auth.models import User, RefreshToken


# Test database configuration
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for testing."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with overridden database."""
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)
    
    with TestClient(app) as c:
        yield c
    
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_user_data():
    """Sample user registration data."""
    return {
        "email": "test@example.com",
        "password": "testpassword123",
        "full_name": "Test User"
    }


@pytest.fixture
def test_admin_data():
    """Sample admin registration data."""
    return {
        "email": "admin@example.com",
        "password": "adminpassword123",
        "full_name": "Admin User",
        "role": "admin"
    }


@pytest.fixture
def registered_user(client, test_user_data):
    """Register a test user and return response data."""
    response = client.post("/api/v1/auth/register", json=test_user_data)
    return response.json()


@pytest.fixture
def auth_headers(registered_user):
    """Get authorization headers for authenticated requests."""
    return {"Authorization": f"Bearer {registered_user['tokens']['access_token']}"}


@pytest.fixture
def sample_coordinates():
    """Sample coordinates for testing."""
    return {
        "coordinates": [
            {"latitude": 6.07, "longitude": -0.24, "name": "Test Location 1"},
            {"latitude": 6.09, "longitude": -0.22, "name": "Test Location 2"},
            {"latitude": 6.05, "longitude": -0.26, "name": "Test Location 3"}
        ]
    }


@pytest.fixture
def sample_geojson():
    """Sample GeoJSON for testing."""
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-0.24, 6.07]},
                "properties": {"name": "GeoJSON Point 1"}
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-0.22, 6.09]},
                "properties": {"name": "GeoJSON Point 2"}
            }
        ]
    }
