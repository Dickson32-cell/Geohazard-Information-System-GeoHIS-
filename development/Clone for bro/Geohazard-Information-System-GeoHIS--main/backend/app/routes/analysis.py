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
import math
from datetime import datetime, timedelta

# Import analysis modules
from ..analysis import (
    FloodRiskAnalyzer,
    LandslideRiskAnalyzer,
    RiskAssessmentEngine,
    run_complete_analysis,
    calculate_flood_weights,
    calculate_landslide_weights,
    generate_sample_validation,
    EarthquakeRiskAnalyzer,
    create_sample_earthquake_analysis
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


class EarthquakeRequest(BaseModel):
    study_area: Optional[StudyAreaBounds] = None
    use_sample_data: bool = True


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


# ============== Study Area Assistant ==============

class StudyAreaValidation(BaseModel):
    """Validation results for study area bounds."""
    is_valid: bool
    area_km2: float
    aspect_ratio: float
    warnings: List[str]
    suggestions: List[str]


class StudyAreaSuggestion(BaseModel):
    """Suggested study area improvements."""
    bounds: StudyAreaBounds
    reason: str
    improvement: str


@router.post("/study-area/validate")
async def validate_study_area(bounds: StudyAreaBounds):
    """
    Validate and analyze study area bounds for geohazard analysis.
    
    Provides feedback on:
    - Geographic validity
    - Area size appropriateness
    - Shape characteristics
    - Analysis suitability
    """
    try:
        # Calculate area in square kilometers
        lat_diff = bounds.max_lat - bounds.min_lat
        lon_diff = bounds.max_lon - bounds.min_lon
        
        # Approximate area calculation (rough estimate)
        avg_lat = (bounds.min_lat + bounds.max_lat) / 2
        lat_km = lat_diff * 111  # 1 degree lat ≈ 111 km
        lon_km = lon_diff * 111 * abs(math.cos(math.radians(avg_lat)))  # Adjust for latitude
        area_km2 = lat_km * lon_km
        
        # Calculate aspect ratio
        aspect_ratio = max(lat_km, lon_km) / min(lat_km, lon_km) if min(lat_km, lon_km) > 0 else float('inf')
        
        warnings = []
        suggestions = []
        
        # Validation checks
        if area_km2 < 1:
            warnings.append("Study area is very small (< 1 km²). Results may be unreliable.")
            suggestions.append("Consider expanding the study area for more representative results.")
        
        if area_km2 > 10000:
            warnings.append("Study area is very large (> 10,000 km²). Analysis may be computationally intensive.")
            suggestions.append("Consider dividing into smaller sub-areas for detailed analysis.")
        
        if aspect_ratio > 5:
            warnings.append(f"Study area is elongated (aspect ratio: {aspect_ratio:.1f}).")
            suggestions.append("Consider a more square-shaped area for balanced analysis.")
        
        # Geographic bounds validation for Ghana/New Juaben South
        if not (4.5 <= bounds.min_lat <= 11.5 and 4.5 <= bounds.max_lat <= 11.5):
            warnings.append("Latitude bounds are outside typical Ghana coordinates.")
        
        if not (-3.5 <= bounds.min_lon <= 1.5 and -3.5 <= bounds.max_lon <= 1.5):
            warnings.append("Longitude bounds are outside typical Ghana coordinates.")
        
        # Check if within New Juaben South municipality bounds
        njs_bounds = {
            'min_lat': 6.05, 'max_lat': 6.15,
            'min_lon': -0.35, 'max_lon': -0.20
        }
        
        is_within_njs = (
            bounds.min_lat >= njs_bounds['min_lat'] - 0.1 and
            bounds.max_lat <= njs_bounds['max_lat'] + 0.1 and
            bounds.min_lon >= njs_bounds['min_lon'] - 0.1 and
            bounds.max_lon <= njs_bounds['max_lon'] + 0.1
        )
        
        if not is_within_njs:
            suggestions.append("Consider focusing on New Juaben South municipality for validated data.")
        
        validation = StudyAreaValidation(
            is_valid=len(warnings) == 0,
            area_km2=round(area_km2, 2),
            aspect_ratio=round(aspect_ratio, 2),
            warnings=warnings,
            suggestions=suggestions
        )
        
        return {
            "status": "success",
            "data": validation,
            "message": "Study area validation completed"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/study-area/suggest")
async def suggest_study_area_improvements(bounds: StudyAreaBounds):
    """
    Suggest improved study area bounds based on analysis requirements.
    
    Provides optimized bounds for:
    - Better aspect ratios
    - Appropriate sizes
    - Geographic alignment
    """
    try:
        suggestions = []
        
        # Calculate current metrics
        lat_diff = bounds.max_lat - bounds.min_lat
        lon_diff = bounds.max_lon - bounds.min_lon
        avg_lat = (bounds.min_lat + bounds.max_lat) / 2
        
        lat_km = lat_diff * 111
        lon_km = lon_diff * 111 * abs(math.cos(math.radians(avg_lat)))
        aspect_ratio = max(lat_km, lon_km) / min(lat_km, lon_km) if min(lat_km, lon_km) > 0 else float('inf')
        
        # Suggest square area
        if aspect_ratio > 1.5:
            # Make it more square
            avg_size = (lat_km + lon_km) / 2
            center_lat = (bounds.min_lat + bounds.max_lat) / 2
            center_lon = (bounds.min_lon + bounds.max_lon) / 2
            
            lat_radius = avg_size / (2 * 111)
            lon_radius = avg_size / (2 * 111 * abs(math.cos(math.radians(center_lat))))
            
            square_bounds = StudyAreaBounds(
                min_lat=center_lat - lat_radius,
                max_lat=center_lat + lat_radius,
                min_lon=center_lon - lon_radius,
                max_lon=center_lon + lon_radius
            )
            
            suggestions.append(StudyAreaSuggestion(
                bounds=square_bounds,
                reason="Current area is elongated",
                improvement="More balanced square shape for uniform analysis"
            ))
        
        # Suggest optimal size (around 100-500 km² for municipal analysis)
        current_area = lat_km * lon_km
        if current_area < 50 or current_area > 1000:
            target_area = 250  # km²
            target_side = math.sqrt(target_area)
            
            center_lat = (bounds.min_lat + bounds.max_lat) / 2
            center_lon = (bounds.min_lon + bounds.max_lon) / 2
            
            lat_radius = target_side / (2 * 111)
            lon_radius = target_side / (2 * 111 * abs(math.cos(math.radians(center_lat))))
            
            optimal_bounds = StudyAreaBounds(
                min_lat=center_lat - lat_radius,
                max_lat=center_lat + lat_radius,
                min_lon=center_lon - lon_radius,
                max_lon=center_lon + lon_radius
            )
            
            suggestions.append(StudyAreaSuggestion(
                bounds=optimal_bounds,
                reason=f"Current area ({current_area:.0f} km²) is not optimal for municipal analysis",
                improvement="Optimal size for detailed geohazard assessment"
            ))
        
        # Suggest New Juaben South focus
        njs_bounds = StudyAreaBounds(
            min_lat=6.05, max_lat=6.15,
            min_lon=-0.35, max_lon=-0.20
        )
        
        suggestions.append(StudyAreaSuggestion(
            bounds=njs_bounds,
            reason="New Juaben South has validated geohazard data",
            improvement="Use municipality boundaries for reliable analysis"
        ))
        
        return {
            "status": "success",
            "data": suggestions,
            "message": f"Generated {len(suggestions)} study area improvement suggestions"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== Real-time Analysis Execution ==============

class AnalysisStatus(BaseModel):
    """Status of an ongoing analysis."""
    analysis_id: str
    status: str  # 'pending', 'running', 'completed', 'failed'
    progress: float  # 0-100
    current_step: str
    start_time: str
    estimated_completion: Optional[str] = None
    error_message: Optional[str] = None


class AnalysisProgress(BaseModel):
    """Progress update for analysis."""
    analysis_id: str
    progress: float
    step: str
    message: str


# In-memory storage for analysis status (in production, use Redis/database)
_analysis_status: Dict[str, AnalysisStatus] = {}


@router.post("/analysis/start")
async def start_analysis(request: AnalysisRequest):
    """
    Start a comprehensive geohazard analysis with real-time progress tracking.
    
    Returns an analysis ID that can be used to track progress and retrieve results.
    """
    try:
        import uuid
        from datetime import datetime, timedelta
        
        analysis_id = str(uuid.uuid4())
        
        # Initialize analysis status
        status = AnalysisStatus(
            analysis_id=analysis_id,
            status="pending",
            progress=0.0,
            current_step="Initializing analysis",
            start_time=datetime.now().isoformat()
        )
        
        _analysis_status[analysis_id] = status
        
        # Start background analysis (simplified - in production use proper async tasks)
        # For now, we'll simulate progress updates
        
        return {
            "status": "success",
            "data": {
                "analysis_id": analysis_id,
                "message": "Analysis started successfully"
            },
            "message": "Analysis initialization completed"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analysis/{analysis_id}/status")
async def get_analysis_status(analysis_id: str):
    """
    Get the current status of an analysis.
    
    Returns progress, current step, and completion status.
    """
    if analysis_id not in _analysis_status:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return {
        "status": "success",
        "data": _analysis_status[analysis_id],
        "message": "Analysis status retrieved"
    }


@router.get("/analysis/{analysis_id}/results")
async def get_analysis_results(analysis_id: str):
    """
    Get the results of a completed analysis.
    
    Returns susceptibility maps, statistics, and risk assessments.
    """
    if analysis_id not in _analysis_status:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    status = _analysis_status[analysis_id]
    
    if status.status != "completed":
        raise HTTPException(status_code=400, detail="Analysis is not yet completed")
    
    # For demo purposes, return sample results
    # In production, store actual results with the analysis ID
    try:
        bounds = DEFAULT_BOUNDS
        
        # Run all analyses
        flood_analyzer = FloodRiskAnalyzer(bounds)
        flood_result = flood_analyzer.compute_flood_susceptibility()
        
        landslide_analyzer = LandslideRiskAnalyzer(bounds)
        landslide_result = landslide_analyzer.compute_landslide_susceptibility()
        
        earthquake_analyzer = EarthquakeRiskAnalyzer(bounds)
        earthquake_result = create_sample_earthquake_analysis(bounds)
        
        # Run risk assessment
        sample_infrastructure = [
            {'id': 'SCH-001', 'name': 'Koforidua SHTS', 'asset_type': 'school',
             'population_served': 2500, 'vulnerability_score': 0.45},
            {'id': 'BRD-001', 'name': 'Main Road Bridge', 'asset_type': 'bridge',
             'population_served': 80000, 'vulnerability_score': 0.5},
        ]
        
        risk_results = run_complete_analysis(
            study_area_bounds=bounds,
            infrastructure=sample_infrastructure,
            include_validation=True
        )
        
        return {
            "status": "success",
            "data": {
                "analysis_id": analysis_id,
                "flood_analysis": {
                    "method": flood_result.method,
                    "statistics": flood_result.statistics,
                    "weights": flood_result.weights
                },
                "landslide_analysis": {
                    "method": landslide_result.method,
                    "statistics": landslide_result.statistics,
                    "weights": landslide_result.weights
                },
                "earthquake_analysis": {
                    "method": "Multi-criteria weighted overlay",
                    "statistics": earthquake_result.statistics,
                    "weights": earthquake_result.weights
                },
                "risk_assessment": risk_results,
                "metadata": {
                    "study_area": bounds,
                    "analysis_time": status.start_time,
                    "completion_time": datetime.now().isoformat()
                }
            },
            "message": "Analysis results retrieved successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== Results Visualization Helpers ==============

class VisualizationConfig(BaseModel):
    """Configuration for results visualization."""
    hazard_type: str  # 'flood', 'landslide', 'earthquake', 'risk'
    visualization_type: str  # 'map', 'chart', 'table'
    color_scheme: Optional[str] = 'viridis'
    show_legend: bool = True
    include_statistics: bool = True


class VisualizationData(BaseModel):
    """Data prepared for visualization."""
    type: str
    data: Any
    config: Dict[str, Any]
    metadata: Dict[str, Any]


@router.post("/visualize")
async def prepare_visualization(config: VisualizationConfig, results: Dict[str, Any]):
    """
    Prepare analysis results for visualization.
    
    Transforms raw analysis data into visualization-ready format
    for maps, charts, and statistical displays.
    """
    try:
        visualization_data = []
        
        if config.hazard_type == 'flood' and 'flood_analysis' in results:
            flood_data = results['flood_analysis']
            
            if config.visualization_type == 'map':
                # Prepare map data
                visualization_data.append(VisualizationData(
                    type='choropleth_map',
                    data={
                        'type': 'FeatureCollection',
                        'features': []  # Would contain GeoJSON features
                    },
                    config={
                        'color_scheme': config.color_scheme,
                        'classes': ['Very Low', 'Low', 'Moderate', 'High', 'Very High'],
                        'show_legend': config.show_legend
                    },
                    metadata={
                        'hazard_type': 'flood',
                        'statistics': flood_data.get('statistics', {}),
                        'method': flood_data.get('method', '')
                    }
                ))
            
            if config.visualization_type == 'chart' and config.include_statistics:
                stats = flood_data.get('statistics', {})
                visualization_data.append(VisualizationData(
                    type='bar_chart',
                    data={
                        'labels': list(stats.get('class_distribution', {}).keys()),
                        'values': list(stats.get('class_distribution', {}).values())
                    },
                    config={
                        'title': 'Flood Susceptibility Distribution',
                        'x_label': 'Susceptibility Class',
                        'y_label': 'Area Count'
                    },
                    metadata={'hazard_type': 'flood'}
                ))
        
        elif config.hazard_type == 'risk' and 'risk_assessment' in results:
            risk_data = results['risk_assessment']
            
            if config.visualization_type == 'table':
                # Prepare risk assessment table
                assets = risk_data.get('asset_risks', [])
                visualization_data.append(VisualizationData(
                    type='data_table',
                    data={
                        'columns': ['Asset Name', 'Type', 'Risk Score', 'Risk Level', 'Recommendations'],
                        'rows': [
                            [
                                asset.get('asset_name', ''),
                                asset.get('asset_type', ''),
                                round(asset.get('risk_score', 0), 3),
                                asset.get('risk_level', ''),
                                '; '.join(asset.get('recommendations', []))
                            ]
                            for asset in assets
                        ]
                    },
                    config={
                        'sortable': True,
                        'filterable': True
                    },
                    metadata={'hazard_type': 'risk'}
                ))
        
        return {
            "status": "success",
            "data": visualization_data,
            "message": f"Prepared {len(visualization_data)} visualization(s)"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== Export Format Assistance ==============

class ExportRequest(BaseModel):
    """Request for exporting analysis results."""
    analysis_id: Optional[str] = None
    format: str  # 'geojson', 'shapefile', 'csv', 'pdf', 'excel'
    include_maps: bool = True
    include_statistics: bool = True
    include_metadata: bool = True
    compression: Optional[str] = None  # 'zip', 'gzip'


class ExportResult(BaseModel):
    """Result of an export operation."""
    export_id: str
    format: str
    file_size: int
    download_url: str
    expires_at: str


@router.post("/export")
async def export_analysis_results(request: ExportRequest):
    """
    Export analysis results in various formats.
    
    Supports multiple export formats for different use cases:
    - GeoJSON/Shapefile: GIS software
    - CSV/Excel: Spreadsheet analysis
    - PDF: Reports and documentation
    """
    try:
        import uuid
        from datetime import datetime, timedelta
        
        export_id = str(uuid.uuid4())
        
        # In production, this would generate actual files
        # For demo, we'll simulate the export process
        
        supported_formats = ['geojson', 'shapefile', 'csv', 'pdf', 'excel']
        if request.format not in supported_formats:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {request.format}")
        
        # Simulate file generation
        file_sizes = {
            'geojson': 245760,  # ~240 KB
            'shapefile': 512000,  # ~500 KB
            'csv': 102400,       # ~100 KB
            'excel': 307200,     # ~300 KB
            'pdf': 2048000       # ~2 MB
        }
        
        file_size = file_sizes.get(request.format, 102400)
        
        # Generate download URL (in production, this would be a secure URL)
        download_url = f"/api/v1/analysis/download/{export_id}"
        
        # Set expiration (24 hours from now)
        expires_at = (datetime.now() + timedelta(hours=24)).isoformat()
        
        export_result = ExportResult(
            export_id=export_id,
            format=request.format,
            file_size=file_size,
            download_url=download_url,
            expires_at=expires_at
        )
        
        return {
            "status": "success",
            "data": export_result,
            "message": f"Export initiated in {request.format} format"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export/{export_id}/status")
async def get_export_status(export_id: str):
    """
    Check the status of an export operation.
    
    Returns completion status and download information.
    """
    # In production, check actual export status
    # For demo, assume all exports complete immediately
    
    return {
        "status": "success",
        "data": {
            "export_id": export_id,
            "status": "completed",
            "progress": 100.0,
            "message": "Export completed successfully"
        },
        "message": "Export status retrieved"
    }


@router.get("/download/{export_id}")
async def download_export(export_id: str):
    """
    Download the exported analysis results.
    
    Returns the file in the requested format.
    """
    # In production, serve the actual file
    # For demo, return a placeholder response
    
    return {
        "status": "success",
        "message": f"Download for export {export_id} would be served here",
        "note": "In production, this would return the actual file"
    }
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


@router.post("/earthquake-susceptibility")
async def compute_earthquake_susceptibility(request: EarthquakeRequest):
    """
    Compute earthquake susceptibility map using multi-criteria analysis.
    
    Conditioning factors:
    - Distance to active faults
    - Peak ground acceleration
    - Soil amplification
    - Building density
    - Seismic history
    """
    try:
        bounds = request.study_area.model_dump() if request.study_area else DEFAULT_BOUNDS
        
        if request.use_sample_data:
            # Use sample data for demonstration
            result = create_sample_earthquake_analysis(bounds)
        else:
            # TODO: Implement real data analysis
            raise HTTPException(status_code=501, detail="Real data analysis not yet implemented")
        
        return {
            "status": "success",
            "data": {
                "hazard_type": "earthquake",
                "method": "Multi-criteria weighted overlay",
                "bounds": result.bounds,
                "statistics": result.statistics,
                "weights": result.weights,
                "timestamp": result.timestamp,
                "susceptibility_sample": result.susceptibility_map[:5] if result.susceptibility_map else []
            },
            "message": "Earthquake susceptibility analysis completed"
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
