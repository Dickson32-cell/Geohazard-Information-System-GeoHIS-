"""
Analysis Engine Tests for GeoHIS

Tests the AHP flood and FR landslide susceptibility analysis engines.
"""

import pytest
import numpy as np


class TestFloodSusceptibility:
    """Tests for flood susceptibility calculation."""
    
    def test_calculate_flood_in_study_area(self):
        """Test flood susceptibility for a point in study area."""
        from app.routes.upload import calculate_flood_susceptibility, is_in_study_area
        
        lat, lon = 6.07, -0.24  # Center of study area
        
        assert is_in_study_area(lat, lon) == True
        
        susceptibility = calculate_flood_susceptibility(lat, lon)
        assert 0 <= susceptibility <= 100
        assert susceptibility > 0  # Should have some susceptibility
    
    def test_calculate_flood_outside_study_area(self):
        """Test flood susceptibility for a point outside study area."""
        from app.routes.upload import calculate_flood_susceptibility, is_in_study_area
        
        lat, lon = 5.50, -0.10  # Outside study area
        
        assert is_in_study_area(lat, lon) == False
        
        susceptibility = calculate_flood_susceptibility(lat, lon)
        assert susceptibility == 50.0  # Default for outside area
    
    def test_flood_susceptibility_range(self):
        """Test that flood susceptibility is always in valid range."""
        from app.routes.upload import calculate_flood_susceptibility
        
        # Test multiple points within study area
        test_points = [
            (6.02, -0.30),  # Corner
            (6.12, -0.18),  # Corner
            (6.07, -0.24),  # Center
            (6.05, -0.28),  # Lower-left
            (6.10, -0.20),  # Upper-right
        ]
        
        for lat, lon in test_points:
            susceptibility = calculate_flood_susceptibility(lat, lon)
            assert 0 <= susceptibility <= 100, f"Failed for ({lat}, {lon})"


class TestLandslideSusceptibility:
    """Tests for landslide susceptibility calculation."""
    
    def test_calculate_landslide_in_study_area(self):
        """Test landslide susceptibility for a point in study area."""
        from app.routes.upload import calculate_landslide_susceptibility, is_in_study_area
        
        lat, lon = 6.07, -0.24  # Center of study area
        
        assert is_in_study_area(lat, lon) == True
        
        susceptibility = calculate_landslide_susceptibility(lat, lon)
        assert 0 <= susceptibility <= 100
    
    def test_calculate_landslide_outside_study_area(self):
        """Test landslide susceptibility for a point outside study area."""
        from app.routes.upload import calculate_landslide_susceptibility, is_in_study_area
        
        lat, lon = 5.50, -0.10  # Outside study area
        
        assert is_in_study_area(lat, lon) == False
        
        susceptibility = calculate_landslide_susceptibility(lat, lon)
        assert susceptibility == 30.0  # Default for outside area
    
    def test_landslide_susceptibility_increases_with_latitude(self):
        """Test that landslide susceptibility increases with latitude (northern highlands)."""
        from app.routes.upload import calculate_landslide_susceptibility
        
        # Same longitude, different latitudes
        lon = -0.24
        lower_lat = 6.03
        higher_lat = 6.11
        
        sus_lower = calculate_landslide_susceptibility(lower_lat, lon)
        sus_higher = calculate_landslide_susceptibility(higher_lat, lon)
        
        assert sus_higher > sus_lower, "Higher latitude should have higher landslide susceptibility"


class TestRiskClassification:
    """Tests for risk classification functions."""
    
    def test_classify_susceptibility(self):
        """Test susceptibility classification."""
        from app.routes.upload import classify_susceptibility
        
        assert classify_susceptibility(10) == "Very Low"
        assert classify_susceptibility(25) == "Low"
        assert classify_susceptibility(50) == "Moderate"
        assert classify_susceptibility(70) == "High"
        assert classify_susceptibility(90) == "Very High"
    
    def test_classify_susceptibility_boundaries(self):
        """Test classification at boundaries."""
        from app.routes.upload import classify_susceptibility
        
        assert classify_susceptibility(0) == "Very Low"
        assert classify_susceptibility(19.9) == "Very Low"
        assert classify_susceptibility(20) == "Low"
        assert classify_susceptibility(39.9) == "Low"
        assert classify_susceptibility(40) == "Moderate"
        assert classify_susceptibility(59.9) == "Moderate"
        assert classify_susceptibility(60) == "High"
        assert classify_susceptibility(79.9) == "High"
        assert classify_susceptibility(80) == "Very High"
        assert classify_susceptibility(100) == "Very High"
    
    def test_calculate_combined_risk(self):
        """Test combined risk calculation."""
        from app.routes.upload import calculate_combined_risk
        
        assert calculate_combined_risk(10, 10) == "Very Low"
        assert calculate_combined_risk(30, 10) == "Low"
        assert calculate_combined_risk(50, 30) == "Moderate"
        assert calculate_combined_risk(70, 40) == "High"
        assert calculate_combined_risk(90, 50) == "Critical"
        
        # Max of the two determines risk
        assert calculate_combined_risk(90, 10) == "Critical"
        assert calculate_combined_risk(10, 90) == "Critical"


class TestStudyAreaBounds:
    """Tests for study area boundary checking."""
    
    def test_point_inside_study_area(self):
        """Test points that should be inside study area."""
        from app.routes.upload import is_in_study_area
        
        # All these should be inside
        assert is_in_study_area(6.07, -0.24) == True  # Center
        assert is_in_study_area(6.02, -0.30) == True  # SW corner
        assert is_in_study_area(6.12, -0.18) == True  # NE corner
    
    def test_point_outside_study_area(self):
        """Test points that should be outside study area."""
        from app.routes.upload import is_in_study_area
        
        # All these should be outside
        assert is_in_study_area(6.01, -0.24) == False  # Too far south
        assert is_in_study_area(6.13, -0.24) == False  # Too far north
        assert is_in_study_area(6.07, -0.31) == False  # Too far west
        assert is_in_study_area(6.07, -0.17) == False  # Too far east
        assert is_in_study_area(5.50, -0.10) == False  # Completely outside


class TestEarthquakeSusceptibility:
    """Tests for earthquake susceptibility analysis."""
    
    def test_earthquake_analyzer_initialization(self):
        """Test that EarthquakeRiskAnalyzer initializes correctly."""
        from app.analysis.earthquake import EarthquakeRiskAnalyzer
        
        bounds = {'min_lat': 6.05, 'max_lat': 6.15, 'min_lon': -0.35, 'max_lon': -0.20}
        analyzer = EarthquakeRiskAnalyzer(bounds)
        
        assert analyzer.bounds == bounds
        assert analyzer.weights['fault_distance'] == 0.30
        assert analyzer.weights['pga'] == 0.25
    
    def test_earthquake_analyzer_custom_weights(self):
        """Test analyzer with custom weights."""
        from app.analysis.earthquake import EarthquakeRiskAnalyzer
        
        bounds = {'min_lat': 6.05, 'max_lat': 6.15, 'min_lon': -0.35, 'max_lon': -0.20}
        custom_weights = {
            'fault_distance': 0.4,
            'pga': 0.3,
            'soil_type': 0.1,
            'building_density': 0.1,
            'seismic_history': 0.1
        }
        analyzer = EarthquakeRiskAnalyzer(bounds, custom_weights)
        
        assert analyzer.weights == custom_weights
    
    def test_earthquake_analyzer_invalid_weights(self):
        """Test that invalid weights raise error."""
        from app.analysis.earthquake import EarthquakeRiskAnalyzer
        
        bounds = {'min_lat': 6.05, 'max_lat': 6.15, 'min_lon': -0.35, 'max_lon': -0.20}
        invalid_weights = {
            'fault_distance': 0.5,
            'pga': 0.5,
            'soil_type': 0.1,
            'building_density': 0.1,
            'seismic_history': 0.1  # Sum = 1.3
        }
        
        with pytest.raises(ValueError):
            EarthquakeRiskAnalyzer(bounds, invalid_weights)
    
    def test_create_sample_earthquake_analysis(self):
        """Test sample earthquake analysis generation."""
        from app.analysis.earthquake import create_sample_earthquake_analysis
        
        bounds = {'min_lat': 6.05, 'max_lat': 6.15, 'min_lon': -0.35, 'max_lon': -0.20}
        result = create_sample_earthquake_analysis(bounds)
        
        assert result.bounds == bounds
        assert 'susceptibility_map' in result.__dict__
        assert 'classification_map' in result.__dict__
        assert 'statistics' in result.__dict__
        assert 'weights' in result.__dict__
        assert result.timestamp is not None
    
    def test_earthquake_analysis_statistics(self):
        """Test that analysis produces valid statistics."""
        from app.analysis.earthquake import create_sample_earthquake_analysis
        
        bounds = {'min_lat': 6.05, 'max_lat': 6.15, 'min_lon': -0.35, 'max_lon': -0.20}
        result = create_sample_earthquake_analysis(bounds)
        
        stats = result.statistics
        assert 'mean' in stats
        assert 'std' in stats
        assert 'min' in stats
        assert 'max' in stats
        assert 'median' in stats
        assert 'class_distribution' in stats
        
        # Check that values are reasonable
        assert 0 <= stats['mean'] <= 100
        assert stats['min'] >= 0
        assert stats['max'] <= 100
        assert stats['std'] >= 0
    
    def test_earthquake_classification(self):
        """Test susceptibility classification."""
        from app.analysis.earthquake import EarthquakeRiskAnalyzer
        
        bounds = {'min_lat': 6.05, 'max_lat': 6.15, 'min_lon': -0.35, 'max_lon': -0.20}
        analyzer = EarthquakeRiskAnalyzer(bounds)
        
        # Test classification boundaries
        assert analyzer._classify_susceptibility(10) == 'Very Low'
        assert analyzer._classify_susceptibility(30) == 'Low'
        assert analyzer._classify_susceptibility(50) == 'Moderate'
        assert analyzer._classify_susceptibility(70) == 'High'
        assert analyzer._classify_susceptibility(90) == 'Very High'
