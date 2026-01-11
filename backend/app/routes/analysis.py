"""
Analysis API Routes for GeoHIS

Provides REST API endpoints for:
- Running flood susceptibility analysis
- Running landslide susceptibility analysis
- Model validation
- Complete risk assessment
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import os

# Import analysis modules
from ..analysis import (
    FloodRiskAnalyzer,
    LandslideRiskAnalyzer,
    RiskAssessmentEngine,
    run_complete_analysis,
    calculate_flood_weights,
    calculate_landslide_weights,
    generate_sample_validation
)

router = APIRouter(prefix="/api/v1/analysis", tags=["analysis"])


# Request/Response models
class StudyAreaBounds(BaseModel):
    min_lat: float = 6.05
    max_lat: float = 6.15
    min_lon: float = -0.35
    max_lon: float = -0.20


class AnalysisRequest(BaseModel):
    study_area: Optional[StudyAreaBounds] = None
    grid_size: int = 50
    include_validation: bool = True


class InfrastructureAsset(BaseModel):
    id: str
    name: str
    asset_type: str
    population_served: int = 1000
    vulnerability_score: float = 0.5


class RiskAssessmentRequest(BaseModel):
    study_area: Optional[StudyAreaBounds] = None
    infrastructure: List[InfrastructureAsset]


# Default study area for New Juaben South
DEFAULT_BOUNDS = {
    'min_lat': 6.05,
    'max_lat': 6.15,
    'min_lon': -0.35,
    'max_lon': -0.20
}


@router.get("/ahp-weights/flood")
async def get_flood_ahp_weights():
    """
    Get AHP weights for flood susceptibility factors.
    
    Returns the calculated weights using Saaty's eigenvector method
    along with consistency ratio for validation.
    """
    try:
        weights = calculate_flood_weights()
        return {
            "status": "success",
            "data": weights,
            "message": "Flood AHP weights calculated successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ahp-weights/landslide")
async def get_landslide_ahp_weights():
    """
    Get AHP weights for landslide susceptibility factors.
    """
    try:
        weights = calculate_landslide_weights()
        return {
            "status": "success",
            "data": weights,
            "message": "Landslide AHP weights calculated successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== Custom Weights Schemas ==============

class CustomFloodWeights(BaseModel):
    """Custom weights for flood susceptibility factors.
    
    Researchers can provide their own expert-derived weights.
    Weights should sum to approximately 1.0 (tolerance: 0.01).
    """
    elevation: float = 0.298
    slope: float = 0.158
    drainage_proximity: float = 0.298
    land_use: float = 0.089
    soil_permeability: float = 0.158
    
    def validate_sum(self) -> bool:
        """Check if weights sum to approximately 1.0."""
        total = self.elevation + self.slope + self.drainage_proximity + self.land_use + self.soil_permeability
        return abs(total - 1.0) <= 0.01
    
    def get_sum(self) -> float:
        """Get the sum of all weights."""
        return self.elevation + self.slope + self.drainage_proximity + self.land_use + self.soil_permeability


class CustomLandslideWeights(BaseModel):
    """Custom weights for landslide susceptibility factors.
    
    Researchers can provide their own expert-derived weights.
    Weights should sum to approximately 1.0 (tolerance: 0.01).
    """
    slope: float = 0.350
    aspect: float = 0.125
    geology: float = 0.225
    land_cover: float = 0.125
    rainfall: float = 0.175
    
    def validate_sum(self) -> bool:
        """Check if weights sum to approximately 1.0."""
        total = self.slope + self.aspect + self.geology + self.land_cover + self.rainfall
        return abs(total - 1.0) <= 0.01
    
    def get_sum(self) -> float:
        """Get the sum of all weights."""
        return self.slope + self.aspect + self.geology + self.land_cover + self.rainfall


class CustomWeightsRequest(BaseModel):
    """Request to set custom AHP weights for analysis."""
    flood_weights: Optional[CustomFloodWeights] = None
    landslide_weights: Optional[CustomLandslideWeights] = None
    normalize: bool = True  # Auto-normalize weights to sum to 1.0


# In-memory storage for current session's custom weights
_custom_flood_weights: Optional[CustomFloodWeights] = None
_custom_landslide_weights: Optional[CustomLandslideWeights] = None


@router.post("/custom-weights")
async def set_custom_weights(request: CustomWeightsRequest):
    """
    Set custom AHP weights for flood and/or landslide susceptibility analysis.
    
    Researchers can define their own factor weights based on:
    - Local expert knowledge
    - Literature review for their specific region
    - Sensitivity analysis results
    
    **Flood Factors**: elevation, slope, drainage_proximity, land_use, soil_permeability
    **Landslide Factors**: slope, aspect, geology, land_cover, rainfall
    
    Weights should ideally sum to 1.0. If normalize=true, weights will be auto-normalized.
    """
    global _custom_flood_weights, _custom_landslide_weights
    
    response = {"status": "success", "applied": {}}
    
    if request.flood_weights:
        weights = request.flood_weights
        
        # Normalize if requested and weights don't sum to 1
        if request.normalize and not weights.validate_sum():
            total = weights.get_sum()
            if total > 0:
                weights = CustomFloodWeights(
                    elevation=weights.elevation / total,
                    slope=weights.slope / total,
                    drainage_proximity=weights.drainage_proximity / total,
                    land_use=weights.land_use / total,
                    soil_permeability=weights.soil_permeability / total
                )
        elif not weights.validate_sum():
            raise HTTPException(
                status_code=400,
                detail=f"Flood weights must sum to 1.0 (current sum: {weights.get_sum():.4f}). Set normalize=true to auto-normalize."
            )
        
        _custom_flood_weights = weights
        response["applied"]["flood_weights"] = {
            "elevation": round(weights.elevation, 4),
            "slope": round(weights.slope, 4),
            "drainage_proximity": round(weights.drainage_proximity, 4),
            "land_use": round(weights.land_use, 4),
            "soil_permeability": round(weights.soil_permeability, 4),
            "sum": round(weights.get_sum(), 4)
        }
    
    if request.landslide_weights:
        weights = request.landslide_weights
        
        # Normalize if requested and weights don't sum to 1
        if request.normalize and not weights.validate_sum():
            total = weights.get_sum()
            if total > 0:
                weights = CustomLandslideWeights(
                    slope=weights.slope / total,
                    aspect=weights.aspect / total,
                    geology=weights.geology / total,
                    land_cover=weights.land_cover / total,
                    rainfall=weights.rainfall / total
                )
        elif not weights.validate_sum():
            raise HTTPException(
                status_code=400,
                detail=f"Landslide weights must sum to 1.0 (current sum: {weights.get_sum():.4f}). Set normalize=true to auto-normalize."
            )
        
        _custom_landslide_weights = weights
        response["applied"]["landslide_weights"] = {
            "slope": round(weights.slope, 4),
            "aspect": round(weights.aspect, 4),
            "geology": round(weights.geology, 4),
            "land_cover": round(weights.land_cover, 4),
            "rainfall": round(weights.rainfall, 4),
            "sum": round(weights.get_sum(), 4)
        }
    
    if not request.flood_weights and not request.landslide_weights:
        raise HTTPException(
            status_code=400,
            detail="At least one of flood_weights or landslide_weights must be provided"
        )
    
    response["message"] = "Custom weights applied successfully. These will be used for subsequent analysis."
    return response


@router.get("/custom-weights")
async def get_custom_weights():
    """
    Get the currently configured custom weights.
    
    Returns both flood and landslide custom weights if set,
    or indicates default weights are being used.
    """
    return {
        "flood_weights": {
            "elevation": round(_custom_flood_weights.elevation, 4) if _custom_flood_weights else 0.298,
            "slope": round(_custom_flood_weights.slope, 4) if _custom_flood_weights else 0.158,
            "drainage_proximity": round(_custom_flood_weights.drainage_proximity, 4) if _custom_flood_weights else 0.298,
            "land_use": round(_custom_flood_weights.land_use, 4) if _custom_flood_weights else 0.089,
            "soil_permeability": round(_custom_flood_weights.soil_permeability, 4) if _custom_flood_weights else 0.158,
            "is_custom": _custom_flood_weights is not None
        },
        "landslide_weights": {
            "slope": round(_custom_landslide_weights.slope, 4) if _custom_landslide_weights else 0.350,
            "aspect": round(_custom_landslide_weights.aspect, 4) if _custom_landslide_weights else 0.125,
            "geology": round(_custom_landslide_weights.geology, 4) if _custom_landslide_weights else 0.225,
            "land_cover": round(_custom_landslide_weights.land_cover, 4) if _custom_landslide_weights else 0.125,
            "rainfall": round(_custom_landslide_weights.rainfall, 4) if _custom_landslide_weights else 0.175,
            "is_custom": _custom_landslide_weights is not None
        }
    }


@router.delete("/custom-weights/reset")
async def reset_custom_weights():
    """
    Reset to default AHP weights calculated from pairwise comparison matrix.
    """
    global _custom_flood_weights, _custom_landslide_weights
    _custom_flood_weights = None
    _custom_landslide_weights = None
    
    return {
        "status": "success",
        "message": "Custom weights reset to defaults. Analysis will now use AHP-calculated weights."
    }


# Helper functions for other modules to access custom weights
def get_active_flood_weights() -> Dict[str, float]:
    """Get currently active flood weights."""
    if _custom_flood_weights:
        return {
            "elevation": _custom_flood_weights.elevation,
            "slope": _custom_flood_weights.slope,
            "drainage_proximity": _custom_flood_weights.drainage_proximity,
            "land_use": _custom_flood_weights.land_use,
            "soil_permeability": _custom_flood_weights.soil_permeability
        }
    return calculate_flood_weights()["weights"]


def get_active_landslide_weights() -> Dict[str, float]:
    """Get currently active landslide weights."""
    if _custom_landslide_weights:
        return {
            "slope": _custom_landslide_weights.slope,
            "aspect": _custom_landslide_weights.aspect,
            "geology": _custom_landslide_weights.geology,
            "land_cover": _custom_landslide_weights.land_cover,
            "rainfall": _custom_landslide_weights.rainfall
        }
    return calculate_landslide_weights()["weights"]


@router.post("/flood-susceptibility")
async def compute_flood_susceptibility(request: AnalysisRequest):
    """
    Compute flood susceptibility map for the study area.
    
    Uses AHP-based multi-criteria analysis with factors:
    - Elevation
    - Slope
    - Drainage proximity
    - Land use
    - Soil permeability
    """
    try:
        bounds = request.study_area.model_dump() if request.study_area else DEFAULT_BOUNDS
        
        analyzer = FloodRiskAnalyzer(bounds)
        result = analyzer.compute_flood_susceptibility(
            spatial_data=None,  # Uses synthetic data for demo
            grid_size=(request.grid_size, request.grid_size)
        )
        
        return {
            "status": "success",
            "data": {
                "hazard_type": result.hazard_type,
                "method": result.method,
                "bounds": result.bounds,
                "crs": result.crs,
                "statistics": result.statistics,
                "weights": result.weights,
                "timestamp": result.timestamp,
                "grid_size": request.grid_size,
                # Susceptibility map is large, only return summary for API
                "susceptibility_sample": result.susceptibility_map[:5] if result.susceptibility_map else []
            },
            "message": "Flood susceptibility analysis completed"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/landslide-susceptibility")
async def compute_landslide_susceptibility(request: AnalysisRequest):
    """
    Compute landslide susceptibility map using Frequency Ratio method.
    
    Conditioning factors:
    - Slope angle/aspect
    - Geology
    - Land cover
    - Rainfall
    """
    try:
        bounds = request.study_area.model_dump() if request.study_area else DEFAULT_BOUNDS
        
        analyzer = LandslideRiskAnalyzer(bounds)
        result = analyzer.compute_landslide_susceptibility(
            spatial_data=None,
            grid_size=(request.grid_size, request.grid_size)
        )
        
        return {
            "status": "success",
            "data": {
                "hazard_type": result.hazard_type,
                "method": result.method,
                "bounds": result.bounds,
                "crs": result.crs,
                "statistics": result.statistics,
                "weights": result.weights,
                "timestamp": result.timestamp,
                "grid_size": request.grid_size,
                "susceptibility_sample": result.susceptibility_map[:5] if result.susceptibility_map else []
            },
            "message": "Landslide susceptibility analysis completed"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/risk-assessment")
async def compute_risk_assessment(request: RiskAssessmentRequest):
    """
    Compute comprehensive risk assessment for infrastructure assets.
    
    Risk = Hazard × Exposure × Vulnerability
    """
    try:
        bounds = request.study_area.model_dump() if request.study_area else DEFAULT_BOUNDS
        
        # Convert infrastructure assets to dict format
        infrastructure = [
            {
                'id': asset.id,
                'name': asset.name,
                'asset_type': asset.asset_type,
                'population_served': asset.population_served,
                'vulnerability_score': asset.vulnerability_score
            }
            for asset in request.infrastructure
        ]
        
        # Run complete analysis
        results = run_complete_analysis(
            study_area_bounds=bounds,
            infrastructure=infrastructure,
            include_validation=True
        )
        
        return {
            "status": "success",
            "data": results,
            "message": "Risk assessment completed successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/validation/sample")
async def get_sample_validation():
    """
    Get sample model validation results.
    
    Demonstrates validation metrics:
    - ROC-AUC
    - Accuracy, Precision, Recall
    - F1-Score
    - Kappa statistic
    """
    try:
        validation = generate_sample_validation()
        return {
            "status": "success",
            "data": validation,
            "message": "Sample validation results generated"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/complete-analysis")
async def run_complete_geohazard_analysis():
    """
    Run complete geohazard analysis with sample data.
    
    Includes:
    - Flood susceptibility mapping
    - Landslide susceptibility mapping
    - Risk assessment for sample infrastructure
    - Model validation metrics
    """
    try:
        # Load sample infrastructure from data file
        data_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        infrastructure_file = os.path.join(data_dir, '..', 'data', 'infrastructure_assets.geojson')
        
        sample_infrastructure = []
        if os.path.exists(infrastructure_file):
            with open(infrastructure_file, 'r') as f:
                data = json.load(f)
                for feature in data.get('features', []):
                    props = feature.get('properties', {})
                    sample_infrastructure.append({
                        'id': props.get('asset_id', ''),
                        'name': props.get('name', 'Unknown'),
                        'asset_type': props.get('asset_type', 'building'),
                        'population_served': props.get('population_served', 1000),
                        'vulnerability_score': props.get('vulnerability_score', 0.5)
                    })
        else:
            # Fallback sample data
            sample_infrastructure = [
                {'id': 'HOS-001', 'name': 'Eastern Regional Hospital', 'asset_type': 'hospital', 
                 'population_served': 50000, 'vulnerability_score': 0.3},
                {'id': 'SCH-001', 'name': 'Koforidua SHTS', 'asset_type': 'school',
                 'population_served': 2500, 'vulnerability_score': 0.45},
                {'id': 'BRD-001', 'name': 'Main Road Bridge', 'asset_type': 'bridge',
                 'population_served': 80000, 'vulnerability_score': 0.5},
            ]
        
        results = run_complete_analysis(
            study_area_bounds=DEFAULT_BOUNDS,
            infrastructure=sample_infrastructure,
            include_validation=True
        )
        
        # Return summary (full maps would be too large)
        return {
            "status": "success",
            "data": {
                "flood_analysis": {
                    "method": results['flood_susceptibility']['method'],
                    "statistics": results['flood_susceptibility']['statistics']
                },
                "landslide_analysis": {
                    "method": results['landslide_susceptibility']['method'],
                    "statistics": results['landslide_susceptibility']['statistics']
                },
                "flood_risk_summary": results['flood_risk_assessment']['summary'],
                "landslide_risk_summary": results['landslide_risk_assessment']['summary'],
                "validation": results['validation'],
                "metadata": results['analysis_metadata']
            },
            "message": "Complete geohazard analysis finished successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
