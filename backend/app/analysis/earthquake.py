"""
Earthquake Risk Analysis Module for GeoHIS

This module implements earthquake susceptibility assessment using
multi-criteria decision analysis with factors like:
- Distance to active faults
- Peak ground acceleration
- Soil amplification
- Building density
- Seismic history

Method: Weighted overlay analysis with AHP-derived weights
"""

from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from dataclasses import dataclass
from datetime import datetime


@dataclass
class EarthquakeResult:
    """Container for earthquake analysis results."""
    susceptibility_map: List[List[float]]
    classification_map: List[List[str]]
    bounds: Dict[str, float]
    statistics: Dict[str, Any]
    weights: Dict[str, float]
    timestamp: str


class EarthquakeRiskAnalyzer:
    """
    Earthquake risk assessment analyzer.
    
    Conditioning factors:
    - Distance to faults (proximity to tectonic features)
    - PGA (Peak Ground Acceleration)
    - Soil type (amplification potential)
    - Building density
    - Seismic history (past events)
    
    Method: Weighted overlay with expert-derived weights
    """
    
    # Classification thresholds (susceptibility index)
    SUSCEPTIBILITY_CLASSES = {
        'Very Low': (0, 20),
        'Low': (20, 40),
        'Moderate': (40, 60),
        'High': (60, 80),
        'Very High': (80, 100)
    }
    
    # Default weights for earthquake factors (expert judgment)
    DEFAULT_WEIGHTS = {
        'fault_distance': 0.30,  # Distance to active faults
        'pga': 0.25,             # Peak ground acceleration
        'soil_type': 0.20,       # Soil amplification
        'building_density': 0.15, # Urban density
        'seismic_history': 0.10   # Historical earthquakes
    }
    
    # Rating scales for each factor (1-5, higher = higher risk)
    FACTOR_RATINGS = {
        'fault_distance': {
            'ranges': [(0, 1000), (1000, 5000), (5000, 10000), (10000, 20000), (20000, 50000)],
            'ratings': [5, 4, 3, 2, 1]  # Closer to faults = higher risk
        },
        'pga': {
            'ranges': [(0, 0.1), (0.1, 0.2), (0.2, 0.3), (0.3, 0.4), (0.4, 1.0)],
            'ratings': [1, 2, 3, 4, 5]  # Higher PGA = higher risk
        },
        'soil_type': {
            'classes': ['rock', 'stiff_soil', 'soft_soil', 'alluvium', 'liquefiable'],
            'ratings': [1, 2, 3, 4, 5]  # More amplifiable = higher risk
        },
        'building_density': {
            'ranges': [(0, 0.1), (0.1, 0.3), (0.3, 0.5), (0.5, 0.7), (0.7, 1.0)],
            'ratings': [1, 2, 3, 4, 5]  # Higher density = higher risk
        },
        'seismic_history': {
            'ranges': [(0, 1), (1, 5), (5, 10), (10, 20), (20, 100)],
            'ratings': [1, 2, 3, 4, 5]  # More events = higher risk
        }
    }
    
    def __init__(self, study_area_bounds: Dict[str, float], weights: Optional[Dict[str, float]] = None):
        """
        Initialize earthquake risk analyzer.
        
        Args:
            study_area_bounds: Geographic bounds (min_lat, max_lat, min_lon, max_lon)
            weights: Custom weights for factors (optional)
        """
        self.bounds = study_area_bounds
        self.weights = weights or self.DEFAULT_WEIGHTS
        self._validate_weights()
        
    def _validate_weights(self):
        """Validate that weights sum to 1.0."""
        total = sum(self.weights.values())
        if not np.isclose(total, 1.0, atol=1e-3):
            raise ValueError(f"Weights must sum to 1.0, got {total}")
    
    def _classify_susceptibility(self, score: float) -> str:
        """Classify susceptibility score into categories."""
        for category, (min_val, max_val) in self.SUSCEPTIBILITY_CLASSES.items():
            if min_val <= score < max_val:
                return category
        return 'Very High'  # For scores >= 80
    
    def analyze(self, 
                fault_distances: List[List[float]], 
                pga_values: List[List[float]], 
                soil_types: List[List[str]], 
                building_densities: List[List[float]], 
                seismic_histories: List[List[int]]) -> EarthquakeResult:
        """
        Run earthquake susceptibility analysis.
        
        Args:
            fault_distances: 2D array of distances to nearest faults (meters)
            pga_values: 2D array of peak ground acceleration values
            soil_types: 2D array of soil type classifications
            building_densities: 2D array of building density (0-1)
            seismic_histories: 2D array of historical earthquake counts
            
        Returns:
            EarthquakeResult with susceptibility maps and statistics
        """
        rows, cols = len(fault_distances), len(fault_distances[0])
        
        # Initialize susceptibility map
        susceptibility_map = np.zeros((rows, cols))
        classification_map = [['Very Low' for _ in range(cols)] for _ in range(rows)]
        
        # Calculate weighted overlay
        for i in range(rows):
            for j in range(cols):
                # Get factor values
                fault_dist = fault_distances[i][j]
                pga = pga_values[i][j]
                soil = soil_types[i][j]
                density = building_densities[i][j]
                history = seismic_histories[i][j]
                
                # Calculate ratings for each factor
                fault_rating = self._get_rating('fault_distance', fault_dist)
                pga_rating = self._get_rating('pga', pga)
                soil_rating = self._get_rating('soil_type', soil)
                density_rating = self._get_rating('building_density', density)
                history_rating = self._get_rating('seismic_history', history)
                
                # Weighted sum
                score = (
                    fault_rating * self.weights['fault_distance'] +
                    pga_rating * self.weights['pga'] +
                    soil_rating * self.weights['soil_type'] +
                    density_rating * self.weights['building_density'] +
                    history_rating * self.weights['seismic_history']
                )
                
                # Normalize to 0-100 scale
                susceptibility_map[i][j] = score * 20  # Since ratings are 1-5, max score = 5
                classification_map[i][j] = self._classify_susceptibility(susceptibility_map[i][j])
        
        # Calculate statistics
        flat_scores = susceptibility_map.flatten()
        statistics = {
            'mean': float(np.mean(flat_scores)),
            'std': float(np.std(flat_scores)),
            'min': float(np.min(flat_scores)),
            'max': float(np.max(flat_scores)),
            'median': float(np.median(flat_scores)),
            'class_distribution': {}
        }
        
        # Count classifications
        flat_classes = np.array(classification_map).flatten()
        for category in self.SUSCEPTIBILITY_CLASSES.keys():
            statistics['class_distribution'][category] = int(np.sum(flat_classes == category))
        
        return EarthquakeResult(
            susceptibility_map=susceptibility_map.tolist(),
            classification_map=classification_map,
            bounds=self.bounds,
            statistics=statistics,
            weights=self.weights,
            timestamp=datetime.now().isoformat()
        )
    
    def _get_rating(self, factor: str, value: Any) -> float:
        """Get rating for a factor value."""
        if factor == 'soil_type':
            # Handle categorical soil types
            soil_ratings = dict(zip(self.FACTOR_RATINGS['soil_type']['classes'],
                                   self.FACTOR_RATINGS['soil_type']['ratings']))
            return soil_ratings.get(value, 3)  # Default to moderate
        
        # Handle numerical ranges
        ranges = self.FACTOR_RATINGS[factor]['ranges']
        ratings = self.FACTOR_RATINGS[factor]['ratings']
        
        for (min_val, max_val), rating in zip(ranges, ratings):
            if min_val <= value < max_val:
                return rating
        
        # Return highest/lowest rating if outside ranges
        return ratings[-1] if value >= ranges[-1][1] else ratings[0]


def create_sample_earthquake_analysis(study_area_bounds: Dict[str, float]) -> EarthquakeResult:
    """
    Create sample earthquake analysis for demonstration.
    
    Generates synthetic data for the study area.
    """
    analyzer = EarthquakeRiskAnalyzer(study_area_bounds)
    
    # Generate sample data (50x50 grid)
    rows, cols = 50, 50
    
    # Sample fault distances (0-50000m)
    fault_distances = np.random.uniform(0, 50000, (rows, cols)).tolist()
    
    # Sample PGA values (0-0.5 g)
    pga_values = np.random.uniform(0, 0.5, (rows, cols)).tolist()
    
    # Sample soil types
    soil_types = np.random.choice(['rock', 'stiff_soil', 'soft_soil', 'alluvium', 'liquefiable'], 
                                 (rows, cols)).tolist()
    
    # Sample building densities (0-1)
    building_densities = np.random.uniform(0, 1, (rows, cols)).tolist()
    
    # Sample seismic history (0-50 events)
    seismic_histories = np.random.randint(0, 50, (rows, cols)).tolist()
    
    return analyzer.analyze(fault_distances, pga_values, soil_types, 
                          building_densities, seismic_histories)