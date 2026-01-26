"""
Integration Tests for Analysis API V2

Tests the new ML and Sensitivity Analysis endpoints.
"""

import pytest
from fastapi.testclient import TestClient
import numpy as np
import json

# We need to import app, but we might have issues with dependencies
# So we'll try to import, and skip if fails (although we fixed dependencies)
try:
    from app.main import app
    client = TestClient(app)
    APP_AVAILABLE = True
except ImportError:
    APP_AVAILABLE = False

@pytest.fixture
def sample_payload():
    """Generate sample payload for analysis requests."""
    np.random.seed(42)
    n_samples = 100
    n_features = 5
    
    features = np.random.randn(n_samples, n_features).tolist()
    # Binary labels
    labels = np.random.randint(0, 2, n_samples).tolist()
    feature_names = [f"feat_{i}" for i in range(n_features)]
    
    return {
        "features": features,
        "labels": labels,
        "feature_names": feature_names,
        "test_size": 0.3
    }

@pytest.mark.skipif(not APP_AVAILABLE, reason="App dependencies not met")
class TestAnalysisV2:
    
    def test_logistic_regression_endpoint(self, sample_payload):
        response = client.post("/api/analysis/v2/logistic-regression", json=sample_payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "results" in data
        assert "coefficients" in data["results"]
        
    def test_random_forest_endpoint(self, sample_payload):
        payload = sample_payload.copy()
        payload["n_estimators"] = 10
        payload["max_depth"] = 5
        
        response = client.post("/api/analysis/v2/random-forest", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "results" in data
        assert "metrics" in data["results"]
        
    def test_xgboost_endpoint(self, sample_payload):
        payload = sample_payload.copy()
        payload["n_estimators"] = 10
        
        response = client.post("/api/analysis/v2/xgboost", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "results" in data
        
    def test_sensitivity_analysis_endpoint(self, sample_payload):
        payload = {
            "model_type": "rf",
            "features": sample_payload["features"][:50],  # Reduce size for speed
            "labels": sample_payload["labels"][:50],
            "feature_names": sample_payload["feature_names"],
            "n_samples": 32  # Small sample for testing
        }
        
        response = client.post("/api/analysis/v2/sensitivity-analysis", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "results" in data
        assert "first_order" in data["results"]
        assert "total_order" in data["results"]

    def test_spatial_cv_integration(self, sample_payload):
        """Test endpoint accepts coordinates for spatial CV."""
        payload = sample_payload.copy()
        # Add coordinates
        n_samples = len(payload["features"])
        coords = np.random.uniform(0, 10, size=(n_samples, 2)).tolist()
        payload["coordinates"] = coords
        payload["n_estimators"] = 10
        
        # Test with RF
        response = client.post("/api/analysis/v2/random-forest", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Should have uncertainty data
        assert "uncertainty" in data["results"]
        assert "mean_uncertainty" in data["results"]["uncertainty"]

if __name__ == "__main__":
    # Allow running directly
    pass
