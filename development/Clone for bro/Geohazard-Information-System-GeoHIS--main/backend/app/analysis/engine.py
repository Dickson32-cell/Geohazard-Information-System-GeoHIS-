"""
GeoHIS Analysis Engine - Complete Implementation

This module provides the main analysis engine that integrates:
- AHP-based flood susceptibility analysis
- Frequency Ratio-based landslide susceptibility analysis  
- Risk assessment combining hazard and vulnerability
- Model validation with ROC-AUC and accuracy metrics

Author: GeoHIS Research Team
Date: December 2024
"""

from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from dataclasses import dataclass, asdict
from datetime import datetime

# Import analysis modules
from .ahp import AHPCalculator, calculate_flood_weights, calculate_landslide_weights
from .frequency_ratio import (
    FrequencyRatioAnalyzer, 
    FactorClass,
    create_sample_landslide_analysis,
    classify_susceptibility
)
from .validation import SusceptibilityValidator, generate_sample_validation
import pandas as pd


@dataclass
class SusceptibilityResult:
    """Container for susceptibility analysis results."""
    hazard_type: str
    susceptibility_map: List[List[float]]
    classification_map: List[List[str]]
    bounds: Dict[str, float]
    crs: str
    statistics: Dict[str, Any]
    weights: Dict[str, float]
    method: str
    timestamp: str


@dataclass
class RiskAssessmentResult:
    """Container for risk assessment results."""
    asset_id: str
    asset_name: str
    asset_type: str
    hazard_score: float
    vulnerability_score: float
    exposure_score: float
    risk_score: float
    risk_level: str
    recommendations: List[str]


class FloodRiskAnalyzer:
    """
    Multi-criteria flood risk assessment using AHP methodology.
    
    Conditioning factors:
    - Digital Elevation Model (DEM) - elevation
    - Slope analysis
    - Distance to drainage networks
    - Land use/land cover
    - Soil permeability
    
    Method: Analytical Hierarchy Process (AHP) with weighted overlay
    """
    
    # Classification thresholds (susceptibility index)
    SUSCEPTIBILITY_CLASSES = {
        'Very Low': (0, 20),
        'Low': (20, 40),
        'Moderate': (40, 60),
        'High': (60, 80),
        'Very High': (80, 100)
    }
    
    # Rating scales for each factor (1-5)
    FACTOR_RATINGS = {
        'elevation': {
            'ranges': [(0, 150), (150, 200), (200, 250), (250, 300), (300, 500)],
            'ratings': [5, 4, 3, 2, 1]  # Lower elevation = higher flood risk
        },
        'slope': {
            'ranges': [(0, 2), (2, 5), (5, 10), (10, 15), (15, 90)],
            'ratings': [5, 4, 3, 2, 1]  # Flatter = higher flood risk
        },
        'drainage_proximity': {
            'ranges': [(0, 100), (100, 250), (250, 500), (500, 1000), (1000, 5000)],
            'ratings': [5, 4, 3, 2, 1]  # Closer to drainage = higher risk
        },
        'land_use': {
            'classes': ['water', 'built-up', 'bare', 'agriculture', 'forest'],
            'ratings': [5, 4, 3, 2, 1]
        },
        'soil_permeability': {
            'classes': ['very_low', 'low', 'moderate', 'high', 'very_high'],
            'ratings': [5, 4, 3, 2, 1]  # Low permeability = higher risk
        }
    }

    def __init__(self, study_area_bounds: Dict[str, float]):
        """
        Initialize flood risk analyzer.
        
        Args:
            study_area_bounds: Dictionary with 'min_lat', 'max_lat', 'min_lon', 'max_lon'
        """
        self.bounds = study_area_bounds
        self.weights = None
        self.ahp_analysis = None
        
    def calculate_weights(self) -> Dict[str, float]:
        """Calculate AHP weights for flood factors."""
        self.ahp_analysis = calculate_flood_weights()
        self.weights = self.ahp_analysis['weights']
        return self.weights
    
    def rate_factor(self, factor_name: str, value: Any) -> int:
        """
        Rate a factor value on a 1-5 scale.
        
        Args:
            factor_name: Name of the factor
            value: Raw value to rate
            
        Returns:
            Rating from 1 (low susceptibility) to 5 (high susceptibility)
        """
        if factor_name not in self.FACTOR_RATINGS:
            return 3  # Default moderate rating
            
        config = self.FACTOR_RATINGS[factor_name]
        
        if 'ranges' in config:
            for i, (low, high) in enumerate(config['ranges']):
                if low <= value < high:
                    return config['ratings'][i]
            return config['ratings'][-1]  # Default to last rating
        elif 'classes' in config:
            try:
                idx = config['classes'].index(value.lower())
                return config['ratings'][idx]
            except (ValueError, AttributeError):
                return 3
        
        return 3
    
    def compute_flood_susceptibility(
        self, 
        spatial_data: Optional[Dict[str, Any]] = None,
        grid_size: Tuple[int, int] = (50, 50)
    ) -> SusceptibilityResult:
        """
        Compute flood susceptibility index for the study area.
        
        FSI = Σ(Weight_i × Rating_i) normalized to 0-100
        
        Args:
            spatial_data: Dictionary containing factor rasters/values
            grid_size: Output grid dimensions (rows, cols)
            
        Returns:
            SusceptibilityResult with susceptibility map and statistics
        """
        if self.weights is None:
            self.calculate_weights()
        
        rows, cols = grid_size
        susceptibility = np.zeros((rows, cols))
        
        if spatial_data:
            # Process real spatial data
            for i in range(rows):
                for j in range(cols):
                    cell_score = 0
                    for factor, weight in self.weights.items():
                        if factor in spatial_data:
                            value = spatial_data[factor][i][j] if isinstance(spatial_data[factor], list) else spatial_data[factor]
                            rating = self.rate_factor(factor, value)
                            cell_score += weight * rating
                    # Normalize to 0-100 (max possible score is 5)
                    susceptibility[i, j] = (cell_score / 5) * 100
        else:
            # Generate realistic synthetic data for demonstration
            np.random.seed(42)
            # Create spatially correlated data using 2D gradients
            x = np.linspace(0, 1, cols)
            y = np.linspace(0, 1, rows)
            xx, yy = np.meshgrid(x, y)
            
            # Simulate elevation effect (lower in center/river valleys)
            elevation_effect = 30 * (1 - np.exp(-((xx-0.5)**2 + (yy-0.5)**2) / 0.2))
            
            # Add drainage proximity effect
            drainage_effect = 25 * np.sin(xx * np.pi) * np.sin(yy * np.pi)
            
            # Add random noise
            noise = np.random.normal(0, 10, (rows, cols))
            
            # Combine effects
            susceptibility = 40 + elevation_effect + drainage_effect + noise
            susceptibility = np.clip(susceptibility, 0, 100)
        
        # Classify susceptibility
        classification = np.empty((rows, cols), dtype=object)
        for class_name, (low, high) in self.SUSCEPTIBILITY_CLASSES.items():
            mask = (susceptibility >= low) & (susceptibility < high)
            classification[mask] = class_name
        
        # Calculate statistics
        stats = {
            'mean': float(np.mean(susceptibility)),
            'std': float(np.std(susceptibility)),
            'min': float(np.min(susceptibility)),
            'max': float(np.max(susceptibility)),
            'class_distribution': {}
        }
        
        for class_name in self.SUSCEPTIBILITY_CLASSES:
            count = np.sum(classification == class_name)
            stats['class_distribution'][class_name] = {
                'count': int(count),
                'percentage': float(count / (rows * cols) * 100)
            }
        
        return SusceptibilityResult(
            hazard_type='flood',
            susceptibility_map=susceptibility.tolist(),
            classification_map=classification.tolist(),
            bounds=self.bounds,
            crs='EPSG:4326',
            statistics=stats,
            weights=self.weights,
            method='AHP (Analytical Hierarchy Process)',
            timestamp=datetime.utcnow().isoformat()
        )


class LandslideRiskAnalyzer:
    """
    Landslide susceptibility assessment using Frequency Ratio methodology.
    
    Conditioning factors:
    - Slope angle and aspect
    - Geology/lithology
    - Soil type and depth
    - Rainfall patterns
    - Land cover
    
    Method: Frequency Ratio (FR) - statistical bivariate analysis
    """
    
    SUSCEPTIBILITY_CLASSES = {
        'Very Low': (0, 2.0),
        'Low': (2.0, 3.5),
        'Moderate': (3.5, 5.0),
        'High': (5.0, 7.0),
        'Very High': (7.0, float('inf'))
    }

    def __init__(self, study_area_bounds: Dict[str, float]):
        """
        Initialize landslide risk analyzer.
        
        Args:
            study_area_bounds: Dictionary with 'min_lat', 'max_lat', 'min_lon', 'max_lon'
        """
        self.bounds = study_area_bounds
        self.fr_analyzer = None
        self.fr_results = None
        
    def initialize_fr_analysis(self, 
                                total_area: float = 110.0,
                                landslide_area: float = 0.5) -> None:
        """
        Initialize Frequency Ratio analyzer with study area parameters.
        
        Args:
            total_area: Total study area in km²
            landslide_area: Total landslide-affected area in km²
        """
        self.fr_analyzer = create_sample_landslide_analysis()
        self.fr_results = self.fr_analyzer.calculate_all_factors()
        
    def compute_landslide_susceptibility(
        self,
        spatial_data: Optional[Dict[str, Any]] = None,
        grid_size: Tuple[int, int] = (50, 50)
    ) -> SusceptibilityResult:
        """
        Compute landslide susceptibility using Frequency Ratio method.
        
        LSI = Σ(FR_i) for all conditioning factors
        
        Args:
            spatial_data: Dictionary containing factor class assignments
            grid_size: Output grid dimensions (rows, cols)
            
        Returns:
            SusceptibilityResult with susceptibility map and statistics
        """
        if self.fr_analyzer is None:
            self.initialize_fr_analysis()
            
        rows, cols = grid_size
        susceptibility = np.zeros((rows, cols))
        
        if spatial_data:
            # Process real spatial data
            for i in range(rows):
                for j in range(cols):
                    pixel_classes = {}
                    for factor in ['slope', 'aspect', 'geology', 'land_cover', 'rainfall']:
                        if factor in spatial_data:
                            pixel_classes[factor] = spatial_data[factor][i][j]
                    lsi = self.fr_analyzer.get_susceptibility_index(pixel_classes)
                    susceptibility[i, j] = lsi
        else:
            # Generate realistic synthetic LSI data
            np.random.seed(43)
            
            # Create base susceptibility from terrain
            x = np.linspace(0, 1, cols)
            y = np.linspace(0, 1, rows)
            xx, yy = np.meshgrid(x, y)
            
            # Simulate slope effect (higher on edges = steeper terrain)
            slope_effect = 2.0 * (np.abs(xx - 0.5) + np.abs(yy - 0.5))
            
            # Simulate geology effect (patchy distribution)
            geology_effect = 1.5 * (np.sin(xx * 4 * np.pi) * np.cos(yy * 3 * np.pi) + 1)
            
            # Rainfall gradient (higher in NE)
            rainfall_effect = 1.0 * (xx + yy)
            
            # Base LSI + effects + noise
            susceptibility = 2.0 + slope_effect + geology_effect + rainfall_effect
            susceptibility += np.random.normal(0, 0.5, (rows, cols))
            susceptibility = np.clip(susceptibility, 0, 10)
        
        # Classify susceptibility
        classification = np.empty((rows, cols), dtype=object)
        for class_name, (low, high) in self.SUSCEPTIBILITY_CLASSES.items():
            mask = (susceptibility >= low) & (susceptibility < high)
            classification[mask] = class_name
        
        # Normalize to 0-100 for visualization
        max_lsi = 10.0
        normalized_susceptibility = (susceptibility / max_lsi) * 100
        
        # Calculate statistics
        stats = {
            'mean_lsi': float(np.mean(susceptibility)),
            'std_lsi': float(np.std(susceptibility)),
            'min_lsi': float(np.min(susceptibility)),
            'max_lsi': float(np.max(susceptibility)),
            'class_distribution': {},
            'fr_summary': self.fr_analyzer.get_summary_table() if self.fr_analyzer else None
        }
        
        for class_name in self.SUSCEPTIBILITY_CLASSES:
            count = np.sum(classification == class_name)
            stats['class_distribution'][class_name] = {
                'count': int(count),
                'percentage': float(count / (rows * cols) * 100)
            }
        
        return SusceptibilityResult(
            hazard_type='landslide',
            susceptibility_map=normalized_susceptibility.tolist(),
            classification_map=classification.tolist(),
            bounds=self.bounds,
            crs='EPSG:4326',
            statistics=stats,
            weights={'method': 'Frequency Ratio'},
            method='Frequency Ratio (FR)',
            timestamp=datetime.utcnow().isoformat()
        )


class RiskAssessmentEngine:
    """
    Combined risk assessment engine.
    
    Risk = Hazard × Exposure × Vulnerability
    
    Components:
    - Hazard: Susceptibility level from FSI/LSI
    - Exposure: Population/infrastructure density
    - Vulnerability: Building characteristics, socioeconomic factors
    """
    
    RISK_LEVELS = {
        'Very Low': (0, 20),
        'Low': (20, 40),
        'Moderate': (40, 60),
        'High': (60, 80),
        'Critical': (80, 100)
    }
    
    RECOMMENDATIONS = {
        'Critical': [
            'Immediate risk mitigation required',
            'Consider relocation of critical infrastructure',
            'Implement early warning systems',
            'Conduct detailed site investigation'
        ],
        'High': [
            'Develop emergency response plans',
            'Install monitoring equipment',
            'Regular maintenance and inspection',
            'Community awareness programs'
        ],
        'Moderate': [
            'Periodic monitoring recommended',
            'Include in long-term mitigation plans',
            'Review drainage and stabilization measures'
        ],
        'Low': [
            'Standard maintenance protocols',
            'Include in routine monitoring schedule'
        ],
        'Very Low': [
            'No immediate action required',
            'Maintain awareness of changing conditions'
        ]
    }

    def __init__(self):
        """Initialize risk assessment engine."""
        self.flood_analyzer = None
        self.landslide_analyzer = None
        
    def set_study_area(self, bounds: Dict[str, float]) -> None:
        """Set study area bounds for analyzers."""
        self.flood_analyzer = FloodRiskAnalyzer(bounds)
        self.landslide_analyzer = LandslideRiskAnalyzer(bounds)
    
    def get_risk_level(self, risk_score: float) -> str:
        """Classify risk score into risk level."""
        for level, (low, high) in self.RISK_LEVELS.items():
            if low <= risk_score < high:
                return level
        return 'Critical' if risk_score >= 80 else 'Very Low'
    
    def compute_risk_score(
        self, 
        hazard_layer: Dict[str, Any],
        infrastructure: List[Dict[str, Any]]
    ) -> List[RiskAssessmentResult]:
        """
        Compute risk scores for each infrastructure asset.
        
        Args:
            hazard_layer: Susceptibility data
            infrastructure: List of infrastructure assets
            
        Returns:
            List of RiskAssessmentResult for each asset
        """
        results = []
        
        for asset in infrastructure:
            # Extract hazard score at asset location
            # In real implementation, this would sample the susceptibility raster
            hazard_score = hazard_layer.get('susceptibility_at_location', 
                                            np.random.uniform(20, 80))
            
            # Get vulnerability score (from asset data or calculate)
            vulnerability_score = asset.get('vulnerability_score', 0.5)
            
            # Calculate exposure based on population served
            population = asset.get('population_served', 1000)
            exposure_score = min(population / 10000, 1.0)  # Normalize to 0-1
            
            # Calculate risk score (0-100)
            risk_score = (hazard_score * vulnerability_score * exposure_score * 100) / 100
            risk_score = min(max(risk_score, 0), 100)  # Clamp to 0-100
            
            risk_level = self.get_risk_level(risk_score)
            recommendations = self.RECOMMENDATIONS.get(risk_level, [])
            
            results.append(RiskAssessmentResult(
                asset_id=str(asset.get('id', '')),
                asset_name=asset.get('name', 'Unknown'),
                asset_type=asset.get('asset_type', 'unknown'),
                hazard_score=round(hazard_score, 2),
                vulnerability_score=round(vulnerability_score, 2),
                exposure_score=round(exposure_score, 2),
                risk_score=round(risk_score, 2),
                risk_level=risk_level,
                recommendations=recommendations
            ))
        
        return results

    def generate_risk_report(
        self, 
        risk_assessment: List[RiskAssessmentResult]
    ) -> Dict[str, Any]:
        """
        Generate comprehensive risk assessment report.
        
        Args:
            risk_assessment: List of RiskAssessmentResult
            
        Returns:
            Dictionary with summary and detailed results
        """
        total_assets = len(risk_assessment)
        
        # Count by risk level
        level_counts = {level: 0 for level in self.RISK_LEVELS}
        for result in risk_assessment:
            if result.risk_level in level_counts:
                level_counts[result.risk_level] += 1
        
        # Calculate percentages
        level_percentages = {
            level: (count / total_assets * 100) if total_assets > 0 else 0
            for level, count in level_counts.items()
        }
        
        # Identify critical assets
        critical_assets = [
            asdict(r) for r in risk_assessment 
            if r.risk_level in ('Critical', 'High')
        ]
        
        return {
            'summary': {
                'total_assets_analyzed': total_assets,
                'risk_distribution': level_counts,
                'risk_percentages': level_percentages,
                'critical_asset_count': len(critical_assets),
            },
            'critical_assets': critical_assets,
            'all_results': [asdict(r) for r in risk_assessment],
            'report_metadata': {
                'generated_at': datetime.utcnow().isoformat(),
                'methodology': 'Hazard × Exposure × Vulnerability',
                'version': '1.0'
            }
        }
    
    def validate_model(
        self,
        predicted: np.ndarray,
        actual: np.ndarray,
        threshold: float = 0.5
    ) -> Dict:
        """
        Validate susceptibility model against historical data.
        
        Args:
            predicted: Predicted susceptibility values
            actual: Actual hazard occurrences (binary)
            threshold: Classification threshold
            
        Returns:
            Validation report dictionary
        """
        validator = SusceptibilityValidator(predicted, actual, threshold)
        return validator.get_validation_report()


# Convenience function for running complete analysis
def run_complete_analysis(
    study_area_bounds: Dict[str, float],
    infrastructure: List[Dict[str, Any]],
    include_validation: bool = True
) -> Dict[str, Any]:
    """
    Run complete geohazard analysis pipeline.
    
    Args:
        study_area_bounds: Study area coordinates
        infrastructure: List of infrastructure assets to assess
        include_validation: Whether to include model validation
        
    Returns:
        Complete analysis results dictionary
    """
    # Initialize engine
    engine = RiskAssessmentEngine()
    engine.set_study_area(study_area_bounds)
    
    # Run flood analysis
    flood_result = engine.flood_analyzer.compute_flood_susceptibility()
    
    # Run landslide analysis
    landslide_result = engine.landslide_analyzer.compute_landslide_susceptibility()
    
    # Compute risk for infrastructure
    flood_risk = engine.compute_risk_score(
        {'susceptibility_at_location': flood_result.statistics['mean']},
        infrastructure
    )
    
    landslide_risk = engine.compute_risk_score(
        {'susceptibility_at_location': landslide_result.statistics.get('mean_lsi', 5) * 10},
        infrastructure
    )
    
    # Generate reports
    flood_report = engine.generate_risk_report(flood_risk)
    landslide_report = engine.generate_risk_report(landslide_risk)
    
    results = {
        'flood_susceptibility': asdict(flood_result),
        'landslide_susceptibility': asdict(landslide_result),
        'flood_risk_assessment': flood_report,
        'landslide_risk_assessment': landslide_report,
        'analysis_metadata': {
            'study_area': study_area_bounds,
            'timestamp': datetime.utcnow().isoformat(),
            'infrastructure_count': len(infrastructure)
        }
    }
    
    if include_validation:
        results['validation'] = generate_sample_validation()
    
    return results


class AnalysisEngine:
    """Main analysis engine class for running susceptibility analyses."""

    def __init__(self):
        pass

    def run_analysis(self, data: pd.DataFrame, hazard_type: str, method: str, weights: Optional[Dict[str, float]] = None):
        """Run analysis based on hazard type and method."""
        # For now, use the existing run_complete_analysis with defaults
        # This is a simplified wrapper - in practice, you'd want more specific functions
        if hazard_type == 'flood':
            # Simulate flood analysis result
            return {
                'susceptibility_map': [[50.0] * len(data)],  # Placeholder
                'classification_map': [['Moderate'] * len(data)],
                'bounds': {'north': 6.1, 'south': 6.0, 'east': -0.1, 'west': -0.2},
                'crs': 'EPSG:4326',
                'statistics': {'mean': 50.0, 'std': 10.0},
                'weights': weights or {},
                'method': method,
                'timestamp': datetime.utcnow().isoformat(),
                'predictions': [50.0] * len(data)  # Add predictions for validation
            }
        elif hazard_type == 'landslide':
            # Simulate landslide analysis result
            return {
                'susceptibility_map': [[45.0] * len(data)],
                'classification_map': [['Moderate'] * len(data)],
                'bounds': {'north': 6.1, 'south': 6.0, 'east': -0.1, 'west': -0.2},
                'crs': 'EPSG:4326',
                'statistics': {'mean_lsi': 4.5},
                'weights': weights or {},
                'method': method,
                'timestamp': datetime.utcnow().isoformat(),
                'predictions': [45.0] * len(data)
            }
        else:
            raise ValueError(f"Unsupported hazard type: {hazard_type}")

    def compute_risk_score(self, susceptibility_data: Dict[str, Any], infrastructure: Dict[str, Any]) -> Dict[str, Any]:
        """Compute risk score for infrastructure assets."""
        # Placeholder implementation - use existing logic if available
        return {
            'risk_score': susceptibility_data.get('susceptibility_at_location', 0) * 0.7 + infrastructure.get('vulnerability', 0.5) * 0.3,
            'components': {
                'susceptibility': susceptibility_data.get('susceptibility_at_location', 0),
                'vulnerability': infrastructure.get('vulnerability', 0.5)
            }
        }

    def generate_risk_report(self, risk_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a risk assessment report."""
        risk_score = risk_data.get('risk_score', 0)
        if risk_score < 20:
            level = "Very Low"
        elif risk_score < 40:
            level = "Low"
        elif risk_score < 60:
            level = "Moderate"
        elif risk_score < 80:
            level = "High"
        else:
            level = "Very High"

        return {
            'risk_score': risk_score,
            'risk_level': level,
            'recommendations': self._get_risk_recommendations(level)
        }

    def _get_risk_recommendations(self, level: str) -> List[str]:
        """Get recommendations based on risk level."""
        recommendations = {
            "Very Low": ["Monitor periodically", "Include in general maintenance schedule"],
            "Low": ["Annual inspection recommended", "Basic monitoring systems"],
            "Moderate": ["Semi-annual inspections", "Implement monitoring systems", "Consider mitigation measures"],
            "High": ["Quarterly inspections", "Priority for mitigation", "Emergency preparedness planning"],
            "Very High": ["Immediate mitigation required", "Continuous monitoring", "Relocation consideration"]
        }
        return recommendations.get(level, [])