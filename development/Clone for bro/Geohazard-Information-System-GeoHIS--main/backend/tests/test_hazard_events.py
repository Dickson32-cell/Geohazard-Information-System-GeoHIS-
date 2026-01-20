import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_hazard_event():
    hazard_event_data = {
        "hazard_type": "flood",
        "geometry": "POINT(-0.2583 6.0965)",
        "event_date": "2023-01-01T00:00:00",
        "severity": "high",
        "description": "Test flood event",
        "damage_estimate": 10000.0,
        "casualties": 5,
        "data_source": "field survey"
    }
    response = client.post("/api/v1/hazard-events/", json=hazard_event_data)
    assert response.status_code == 200
    data = response.json()
    assert data["hazard_type"] == "flood"
    assert data["severity"] == "high"

def test_read_hazard_events():
    response = client.get("/api/v1/hazard-events/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}