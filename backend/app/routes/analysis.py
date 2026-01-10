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
