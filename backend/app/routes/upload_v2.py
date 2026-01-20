"""
Upload API endpoints for GeoHIS - Production Ready Version

Handles coordinate and GeoJSON analysis requests.
Works in two modes:
1. WITH DATA: Real raster-based calculations for research-quality results
2. WITHOUT DATA: Clear messaging about data requirements

Author: GeoHIS Team
Version: 2.0.0
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Request
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import json
import uuid
from datetime import datetime
from decouple import config
import logging

from app.middleware.rate_limit import limiter
from app.middleware.security import sanitize_filename
from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.routes.study_area import get_active_study_area, is_point_in_study_area

# Import the production geospatial service
try:
    from app.services.geospatial_v2 import get_geospatial_service, get_data_manager
    USE_V2_SERVICE = True
except ImportError:
    from app.services.geospatial import GeospatialService
    USE_V2_SERVICE = False

logger = logging.getLogger(__name__)
router = APIRouter()

# Configuration
MAX_COORDINATES = config("MAX_COORDINATES_PER_REQUEST", default=10000, cast=int)
MAX_FILE_SIZE = config("MAX_UPLOAD_SIZE_MB", default=50, cast=int) * 1024 * 1024


# Request/Response Models
class CoordinateInput(BaseModel):
    """Single coordinate for analysis"""
    latitude: float = Field(..., ge=-90, le=90, description="Latitude in decimal degrees")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude in decimal degrees")
    name: Optional[str] = Field(None, description="Optional location name", max_length=255)


class CoordinatesRequest(BaseModel):
    """Multiple coordinates for batch analysis"""
    coordinates: List[CoordinateInput]


class SusceptibilityResult(BaseModel):
    """Susceptibility analysis result for a single location"""
    latitude: float
    longitude: float
    name: Optional[str] = None
    flood_susceptibility: Optional[float] = Field(None, ge=0, le=100)
    flood_class: str
    landslide_susceptibility: Optional[float] = Field(None, ge=0, le=100)
    landslide_class: str
    combined_risk: str
    in_study_area: bool
    has_real_data: bool = False
    data_quality: Optional[Dict[str, Any]] = None


class AnalysisResponse(BaseModel):
    """Response containing analysis results"""
    session_id: str
    timestamp: str
    location_count: int
    results: List[SusceptibilityResult]
    summary: dict
    data_status: Optional[dict] = None


def classify_susceptibility(value: Optional[float]) -> str:
    """Classify susceptibility value into risk category"""
    if value is None:
        return "Data Required"
    if value < 20:
        return "Very Low"
    elif value < 40:
        return "Low"
    elif value < 60:
        return "Moderate"
    elif value < 80:
        return "High"
    else:
        return "Very High"


def calculate_combined_risk(flood: Optional[float], landslide: Optional[float]) -> str:
    """Calculate combined multi-hazard risk level"""
    if flood is None and landslide is None:
        return "Data Required"
    
    max_risk = max(flood or 0, landslide or 0)
    
    if max_risk >= 80:
        return "Critical"
    elif max_risk >= 60:
        return "High"
    elif max_risk >= 40:
        return "Moderate"
    elif max_risk >= 20:
        return "Low"
    else:
        return "Very Low"


def process_coordinates_v2(coordinates: List[CoordinateInput]) -> tuple:
    """
    Process coordinates using the v2 geospatial service.
    
    Works with or without raster data:
    - With data: Returns real calculated susceptibility values
    - Without data: Returns None values with informative messages
    """
    service = get_geospatial_service()
    data_manager = get_data_manager()
    
    results = []
    has_any_real_data = False
    
    for coord in coordinates:
        try:
            # Calculate flood susceptibility
            flood_result = service.calculate_flood_susceptibility(
                coord.latitude, coord.longitude
            )
            
            # Calculate landslide susceptibility  
            landslide_result = service.calculate_landslide_susceptibility(
                coord.latitude, coord.longitude
            )
            
            # Extract values
            flood_sus = flood_result.get('susceptibility_index')
            landslide_sus = landslide_result.get('susceptibility_index')
            
            has_real_data = (
                flood_result.get('has_real_data', False) or 
                landslide_result.get('has_real_data', False)
            )
            
            if has_real_data:
                has_any_real_data = True
            
            result = SusceptibilityResult(
                latitude=coord.latitude,
                longitude=coord.longitude,
                name=coord.name,
                flood_susceptibility=flood_sus,
                flood_class=flood_result.get('classification', 'Data Required'),
                landslide_susceptibility=landslide_sus,
                landslide_class=landslide_result.get('classification', 'Data Required'),
                combined_risk=calculate_combined_risk(flood_sus, landslide_sus),
                in_study_area=is_point_in_study_area(coord.latitude, coord.longitude),
                has_real_data=has_real_data,
                data_quality=flood_result.get('data_quality')
            )
            results.append(result)
            
        except Exception as e:
            logger.error(f"Error processing ({coord.latitude}, {coord.longitude}): {e}")
            results.append(SusceptibilityResult(
                latitude=coord.latitude,
                longitude=coord.longitude,
                name=coord.name,
                flood_susceptibility=None,
                flood_class="Error",
                landslide_susceptibility=None,
                landslide_class="Error",
                combined_risk="Error",
                in_study_area=is_point_in_study_area(coord.latitude, coord.longitude),
                has_real_data=False,
                data_quality={"error": str(e)}
            ))
    
    # Calculate summary
    valid_flood = [r for r in results if r.flood_susceptibility is not None]
    valid_landslide = [r for r in results if r.landslide_susceptibility is not None]
    
    # Get data status
    data_status = service.get_data_status()
    
    summary = {
        "locations_analyzed": len(results),
        "in_study_area": sum(1 for r in results if r.in_study_area),
        "outside_study_area": sum(1 for r in results if not r.in_study_area),
        "results_with_real_data": sum(1 for r in results if r.has_real_data),
        "average_flood_susceptibility": round(
            sum(r.flood_susceptibility for r in valid_flood) / len(valid_flood), 2
        ) if valid_flood else None,
        "average_landslide_susceptibility": round(
            sum(r.landslide_susceptibility for r in valid_landslide) / len(valid_landslide), 2
        ) if valid_landslide else None,
        "high_risk_locations": sum(
            1 for r in results if r.combined_risk in ["High", "Critical"]
        ),
        "study_area": get_active_study_area().name,
        "analysis_method": "Real Raster Data" if has_any_real_data else "Data Required",
        "data_available": data_status['summary']['available'],
        "data_total": data_status['summary']['total']
    }
    
    # Add message if no data
    if not has_any_real_data:
        summary["message"] = (
            "No geospatial data available. Please upload raster data "
            "(DEM, slope, land use, etc.) via the /api/v1/data/upload endpoint "
            "to perform real susceptibility analysis."
        )
        summary["missing_for_flood"] = data_status['summary']['missing_for_flood']
        summary["missing_for_landslide"] = data_status['summary']['missing_for_landslide']
    
    return results, summary, data_status


def process_coordinates_v1(coordinates: List[CoordinateInput]) -> tuple:
    """
    Fallback processing using v1 service (for backward compatibility).
    """
    from app.services.geospatial import GeospatialService
    from app.config import settings
    
    results = []
    
    for coord in coordinates:
        # Get raster paths from settings
        elevation_raster = settings.elevation_raster_path or None
        slope_raster = settings.slope_raster_path or None
        drainage_raster = settings.drainage_raster_path or None
        soil_raster = settings.soil_raster_path or None
        landuse_raster = settings.landuse_raster_path or None
        geology_raster = settings.geology_raster_path or None
        landcover_raster = settings.landcover_raster_path or None
        
        # Calculate susceptibilities
        flood_sus = GeospatialService.calculate_flood_susceptibility_real(
            coord.latitude, coord.longitude,
            elevation_raster=elevation_raster,
            slope_raster=slope_raster,
            drainage_raster=drainage_raster,
            soil_raster=soil_raster,
            landuse_raster=landuse_raster
        )
        
        landslide_sus = GeospatialService.calculate_landslide_susceptibility_real(
            coord.latitude, coord.longitude,
            slope_raster=slope_raster,
            geology_raster=geology_raster,
            landcover_raster=landcover_raster
        )
        
        result = SusceptibilityResult(
            latitude=coord.latitude,
            longitude=coord.longitude,
            name=coord.name,
            flood_susceptibility=round(flood_sus, 2),
            flood_class=classify_susceptibility(flood_sus),
            landslide_susceptibility=round(landslide_sus, 2),
            landslide_class=classify_susceptibility(landslide_sus),
            combined_risk=calculate_combined_risk(flood_sus, landslide_sus),
            in_study_area=is_point_in_study_area(coord.latitude, coord.longitude),
            has_real_data=False  # v1 always returns default values when no data
        )
        results.append(result)
    
    # Summary
    summary = {
        "locations_analyzed": len(results),
        "in_study_area": sum(1 for r in results if r.in_study_area),
        "outside_study_area": sum(1 for r in results if not r.in_study_area),
        "average_flood_susceptibility": round(
            sum(r.flood_susceptibility for r in results) / len(results), 2
        ),
        "average_landslide_susceptibility": round(
            sum(r.landslide_susceptibility for r in results) / len(results), 2
        ),
        "high_risk_locations": sum(
            1 for r in results if r.combined_risk in ["High", "Critical"]
        ),
        "study_area": get_active_study_area().name,
    }
    
    return results, summary, None


@router.post("/upload/coordinates", response_model=AnalysisResponse)
@limiter.limit("30/minute")
async def analyze_coordinates(
    request: Request,
    coord_request: CoordinatesRequest,
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Analyze flood and landslide susceptibility for provided coordinates.
    
    ## How It Works
    
    **With Geospatial Data Uploaded:**
    - Returns real susceptibility calculations based on DEM, slope, land use, etc.
    - Provides research-quality results suitable for publication
    
    **Without Geospatial Data:**
    - Returns `null` susceptibility values
    - Provides clear message about what data needs to be uploaded
    - Use `/api/v1/data/upload` to upload raster files
    
    ## Request
    - **coordinates**: List of coordinate objects
      - `latitude`: Latitude in decimal degrees (-90 to 90)
      - `longitude`: Longitude in decimal degrees (-180 to 180)
      - `name`: Optional location name
    
    ## Response
    - **results**: Susceptibility analysis for each location
    - **summary**: Statistics and data availability info
    - **data_status**: Current state of geospatial data layers
    
    ## Example
    ```json
    {
        "coordinates": [
            {"latitude": 6.07, "longitude": -0.24, "name": "Koforidua Center"}
        ]
    }
    ```
    """
    if len(coord_request.coordinates) > MAX_COORDINATES:
        raise HTTPException(
            status_code=400, 
            detail=f"Maximum {MAX_COORDINATES:,} coordinates per request"
        )
    
    if len(coord_request.coordinates) == 0:
        raise HTTPException(
            status_code=400,
            detail="At least one coordinate is required"
        )
    
    session_id = str(uuid.uuid4())
    
    # Use v2 service if available
    if USE_V2_SERVICE:
        results, summary, data_status = process_coordinates_v2(coord_request.coordinates)
    else:
        results, summary, data_status = process_coordinates_v1(coord_request.coordinates)
    
    # Add user info
    if current_user:
        summary["analyzed_by"] = current_user.email
    
    return AnalysisResponse(
        session_id=session_id,
        timestamp=datetime.utcnow().isoformat(),
        location_count=len(results),
        results=results,
        summary=summary,
        data_status=data_status
    )


@router.post("/upload/geojson", response_model=AnalysisResponse)
@limiter.limit("10/minute")
async def analyze_geojson(
    request: Request,
    file: UploadFile = File(...),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Analyze flood and landslide susceptibility from uploaded GeoJSON file.
    
    Accepts a GeoJSON file containing Point features.
    
    ## Requirements
    - File format: .geojson or .json
    - Maximum file size: 50 MB
    - Maximum points: 10,000
    - Geometry type: Point features only
    
    ## Data Requirements
    Upload geospatial raster data via `/api/v1/data/upload` for real analysis.
    Without data, results will indicate "Data Required".
    """
    # Validate file extension
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")
    
    safe_filename = sanitize_filename(file.filename)
    
    if not safe_filename.endswith(('.geojson', '.json')):
        raise HTTPException(
            status_code=400,
            detail="File must be GeoJSON format (.geojson or .json)"
        )
    
    # Read file content
    try:
        content = await file.read()
        
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)} MB"
            )
        
        geojson = json.loads(content.decode('utf-8'))
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")
    
    # Extract coordinates
    coordinates = []
    
    if geojson.get("type") == "FeatureCollection":
        features = geojson.get("features", [])
    elif geojson.get("type") == "Feature":
        features = [geojson]
    else:
        raise HTTPException(
            status_code=400,
            detail="GeoJSON must be a Feature or FeatureCollection"
        )
    
    for feature in features:
        geometry = feature.get("geometry", {})
        if geometry.get("type") != "Point":
            continue
        
        coords = geometry.get("coordinates", [])
        if len(coords) >= 2:
            name = feature.get("properties", {}).get("name")
            if name and len(name) > 255:
                name = name[:255]
            
            coordinates.append(CoordinateInput(
                longitude=coords[0],
                latitude=coords[1],
                name=name
            ))
    
    if len(coordinates) == 0:
        raise HTTPException(
            status_code=400,
            detail="No valid Point features found in GeoJSON"
        )
    
    if len(coordinates) > MAX_COORDINATES:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {MAX_COORDINATES:,} points per file"
        )
    
    session_id = str(uuid.uuid4())
    
    if USE_V2_SERVICE:
        results, summary, data_status = process_coordinates_v2(coordinates)
    else:
        results, summary, data_status = process_coordinates_v1(coordinates)
    
    summary["source_file"] = safe_filename
    if current_user:
        summary["analyzed_by"] = current_user.email
    
    return AnalysisResponse(
        session_id=session_id,
        timestamp=datetime.utcnow().isoformat(),
        location_count=len(results),
        results=results,
        summary=summary,
        data_status=data_status
    )


@router.get("/upload/study-area")
async def get_study_area_bounds():
    """
    Get the bounding box of the current study area.
    
    Returns geographic bounds and metadata for the configured study area.
    Researchers can define custom study areas via `/api/v1/study-area/define`.
    """
    study_area = get_active_study_area()
    
    response = {
        "name": study_area.name,
        "region": study_area.region or "Not specified",
        "country": study_area.country or "Not specified",
        "bounds": {
            "min_latitude": study_area.bounds.min_latitude,
            "max_latitude": study_area.bounds.max_latitude,
            "min_longitude": study_area.bounds.min_longitude,
            "max_longitude": study_area.bounds.max_longitude
        },
        "center": study_area.get_center(),
        "area_km2": study_area.area_km2 or "Not specified",
        "is_custom": study_area.name != "New Juaben South Municipality",
        "limits": {
            "max_coordinates_per_request": MAX_COORDINATES,
            "max_file_size_mb": MAX_FILE_SIZE // (1024 * 1024)
        }
    }
    
    # Add data status if v2 service is available
    if USE_V2_SERVICE:
        service = get_geospatial_service()
        data_status = service.get_data_status()
        response["data_status"] = data_status['summary']
    
    return response


@router.get("/upload/limits")
async def get_upload_limits():
    """
    Get the current upload limits and data status.
    """
    response = {
        "max_coordinates_per_request": MAX_COORDINATES,
        "max_file_size_mb": MAX_FILE_SIZE // (1024 * 1024),
        "max_file_size_bytes": MAX_FILE_SIZE,
        "allowed_file_types": [".geojson", ".json"],
        "rate_limits": {
            "coordinates_endpoint": "30 requests/minute",
            "geojson_endpoint": "10 requests/minute"
        }
    }
    
    # Add data status if v2 service is available
    if USE_V2_SERVICE:
        service = get_geospatial_service()
        data_status = service.get_data_status()
        response["data_status"] = data_status
    
    return response