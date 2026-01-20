"""
Upload and Analysis Tests for GeoHIS

Tests coordinate analysis and GeoJSON file upload functionality.
"""

import pytest
import json
import io
from fastapi import status


class TestCoordinateAnalysis:
    """Tests for coordinate-based analysis."""
    
    def test_analyze_single_coordinate(self, client, auth_headers):
        """Test analyzing a single coordinate."""
        response = client.post("/api/v1/upload/coordinates",
            headers=auth_headers,
            json={
                "coordinates": [
                    {"latitude": 6.07, "longitude": -0.24, "name": "Test Point"}
                ]
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert data["location_count"] == 1
        assert len(data["results"]) == 1
        assert data["results"][0]["in_study_area"] == True
        assert "flood_susceptibility" in data["results"][0]
        assert "landslide_susceptibility" in data["results"][0]
        assert "combined_risk" in data["results"][0]
    
    def test_analyze_multiple_coordinates(self, client, sample_coordinates):
        """Test analyzing multiple coordinates."""
        response = client.post("/api/v1/upload/coordinates",
            json=sample_coordinates
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert data["location_count"] == 3
        assert len(data["results"]) == 3
        assert "summary" in data
        assert data["summary"]["locations_analyzed"] == 3
    
    def test_analyze_coordinate_outside_study_area(self, client):
        """Test analyzing coordinate outside study area."""
        response = client.post("/api/v1/upload/coordinates",
            json={
                "coordinates": [
                    {"latitude": 5.50, "longitude": -0.10, "name": "Outside Area"}
                ]
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert data["results"][0]["in_study_area"] == False
    
    def test_analyze_empty_coordinates(self, client):
        """Test that empty coordinates list returns error."""
        response = client.post("/api/v1/upload/coordinates",
            json={"coordinates": []}
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "at least one" in response.json()["detail"].lower()
    
    def test_analyze_invalid_latitude(self, client):
        """Test that invalid latitude returns error."""
        response = client.post("/api/v1/upload/coordinates",
            json={
                "coordinates": [
                    {"latitude": 100, "longitude": -0.24}  # Invalid latitude
                ]
            }
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_analyze_invalid_longitude(self, client):
        """Test that invalid longitude returns error."""
        response = client.post("/api/v1/upload/coordinates",
            json={
                "coordinates": [
                    {"latitude": 6.07, "longitude": -200}  # Invalid longitude
                ]
            }
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestGeoJSONUpload:
    """Tests for GeoJSON file upload."""
    
    def test_upload_geojson_success(self, client, sample_geojson):
        """Test successful GeoJSON upload."""
        geojson_bytes = json.dumps(sample_geojson).encode('utf-8')
        files = {"file": ("test.geojson", io.BytesIO(geojson_bytes), "application/json")}
        
        response = client.post("/api/v1/upload/geojson", files=files)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert data["location_count"] == 2
        assert "source_file" in data["summary"]
    
    def test_upload_single_feature(self, client):
        """Test uploading a single Feature (not FeatureCollection)."""
        geojson = {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [-0.24, 6.07]},
            "properties": {"name": "Single Point"}
        }
        geojson_bytes = json.dumps(geojson).encode('utf-8')
        files = {"file": ("test.geojson", io.BytesIO(geojson_bytes), "application/json")}
        
        response = client.post("/api/v1/upload/geojson", files=files)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["location_count"] == 1
    
    def test_upload_invalid_json(self, client):
        """Test that invalid JSON returns error."""
        files = {"file": ("test.geojson", io.BytesIO(b"not valid json"), "application/json")}
        
        response = client.post("/api/v1/upload/geojson", files=files)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "invalid json" in response.json()["detail"].lower()
    
    def test_upload_wrong_extension(self, client, sample_geojson):
        """Test that wrong file extension returns error."""
        geojson_bytes = json.dumps(sample_geojson).encode('utf-8')
        files = {"file": ("test.txt", io.BytesIO(geojson_bytes), "text/plain")}
        
        response = client.post("/api/v1/upload/geojson", files=files)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "geojson" in response.json()["detail"].lower()
    
    def test_upload_no_points(self, client):
        """Test that GeoJSON with no points returns error."""
        geojson = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {"type": "LineString", "coordinates": [[-0.24, 6.07], [-0.22, 6.09]]},
                    "properties": {}
                }
            ]
        }
        geojson_bytes = json.dumps(geojson).encode('utf-8')
        files = {"file": ("test.geojson", io.BytesIO(geojson_bytes), "application/json")}
        
        response = client.post("/api/v1/upload/geojson", files=files)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "no valid point" in response.json()["detail"].lower()


class TestStudyAreaInfo:
    """Tests for study area information endpoint."""
    
    def test_get_study_area_bounds(self, client):
        """Test getting study area bounds."""
        response = client.get("/api/v1/upload/study-area")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert data["name"] == "New Juaben South Municipality"
        assert data["country"] == "Ghana"
        assert "bounds" in data
        assert "center" in data
        assert data["area_km2"] == 110
    
    def test_get_upload_limits(self, client):
        """Test getting upload limits."""
        response = client.get("/api/v1/upload/limits")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert data["max_coordinates_per_request"] == 10000
        assert data["max_file_size_mb"] == 50
        assert ".geojson" in data["allowed_file_types"]
