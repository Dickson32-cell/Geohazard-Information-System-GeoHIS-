"""
Upload API endpoints for user data submission and susceptibility analysis.

Allows users to upload coordinates or GeoJSON files for analysis.
Includes file size validation, rate limiting, and optional authentication.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Request
from pydantic import BaseModel, Field
from typing import List, Optional
import json
import uuid
from datetime import datetime
from decouple import config

from app.middleware.rate_limit import limiter
from app.middleware.security import (
    sanitize_filename, get_file_size_limit, 
    validate_content_type, ALLOWED_GEOJSON_TYPES
)
from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.routes.study_area import get_active_study_area, is_point_in_study_area

router = APIRouter()

# Configuration
MAX_COORDINATES = config("MAX_COORDINATES_PER_REQUEST", default=10000, cast=int)
MAX_FILE_SIZE = config("MAX_UPLOAD_SIZE_MB", default=50, cast=int) * 1024 * 1024  # Convert to bytes


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
    flood_susceptibility: float = Field(..., ge=0, le=100)
    flood_class: str
    landslide_susceptibility: float = Field(..., ge=0, le=100)
    landslide_class: str
    combined_risk: str
    in_study_area: bool


class AnalysisResponse(BaseModel):
    """Response containing analysis results"""
    session_id: str
    timestamp: str
    location_count: int
    results: List[SusceptibilityResult]
    summary: dict


def classify_susceptibility(value: float) -> str:
    """Classify susceptibility value into risk category"""
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


def calculate_combined_risk(flood: float, landslide: float) -> str:
    """Calculate combined multi-hazard risk level"""
    max_risk = max(flood, landslide)
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


def is_in_study_area(lat: float, lon: float) -> bool:
    """Check if coordinates are within the current study area bounds.
    
    Uses the dynamically configured study area, allowing researchers
    to define their own regions.
    """
    return is_point_in_study_area(lat, lon)


def calculate_flood_susceptibility(lat: float, lon: float) -> float:
    """
    Calculate flood susceptibility index for a location.
    Based on AHP weights: Elevation (0.298), Drainage Proximity (0.298), 
    Slope (0.158), Soil (0.158), Land Use (0.089)
    
    This is a simplified calculation for demonstration.
    In production, this would query actual raster data.
    """
    if not is_in_study_area(lat, lon):
        return 50.0  # Default moderate susceptibility outside study area
    
    # Simplified model based on location within study area
    # Lower latitude (southern areas) tend to have higher flood susceptibility
    # due to lower elevation near drainage channels
    base_susceptibility = 65.0
    lat_factor = (6.12 - lat) / 0.10 * 15  # Adjust based on latitude
    lon_factor = abs(lon + 0.24) / 0.06 * 10  # Distance from central drainage
    
    susceptibility = base_susceptibility + lat_factor - lon_factor
    return max(0, min(100, susceptibility))


def calculate_landslide_susceptibility(lat: float, lon: float) -> float:
    """
    Calculate landslide susceptibility index for a location.
    Based on FR method with factors: Slope (1.98 for 30-45°), 
    Geology (1.38 for Birimian), Land Cover (2.20 for bare land)
    
    This is a simplified calculation for demonstration.
    In production, this would query actual raster data.
    """
    if not is_in_study_area(lat, lon):
        return 30.0  # Default low susceptibility outside study area
    
    # Simplified model: higher latitudes (northeastern highlands) have higher susceptibility
    base_susceptibility = 25.0
    lat_factor = (lat - 6.02) / 0.10 * 35  # Higher in northern highlands
    lon_factor = (lon + 0.18) / 0.12 * 15  # Higher in eastern areas
    
    susceptibility = base_susceptibility + lat_factor + lon_factor
    return max(0, min(100, susceptibility))


def process_coordinates(coordinates: List[CoordinateInput]) -> tuple:
    """
    Process a list of coordinates and return results with summary.
    
    Args:
        coordinates: List of coordinate inputs
        
    Returns:
        Tuple of (results list, summary dict)
    """
    results = []
    
    for coord in coordinates:
        flood_sus = calculate_flood_susceptibility(coord.latitude, coord.longitude)
        landslide_sus = calculate_landslide_susceptibility(coord.latitude, coord.longitude)
        
        result = SusceptibilityResult(
            latitude=coord.latitude,
            longitude=coord.longitude,
            name=coord.name,
            flood_susceptibility=round(flood_sus, 2),
            flood_class=classify_susceptibility(flood_sus),
            landslide_susceptibility=round(landslide_sus, 2),
            landslide_class=classify_susceptibility(landslide_sus),
            combined_risk=calculate_combined_risk(flood_sus, landslide_sus),
            in_study_area=is_in_study_area(coord.latitude, coord.longitude)
        )
        results.append(result)
    
    # Calculate summary statistics
    in_area_count = sum(1 for r in results if r.in_study_area)
    avg_flood = sum(r.flood_susceptibility for r in results) / len(results)
    avg_landslide = sum(r.landslide_susceptibility for r in results) / len(results)
    high_risk_count = sum(1 for r in results if r.combined_risk in ["High", "Critical"])
    
    summary = {
        "locations_analyzed": len(results),
        "in_study_area": in_area_count,
        "outside_study_area": len(results) - in_area_count,
        "average_flood_susceptibility": round(avg_flood, 2),
        "average_landslide_susceptibility": round(avg_landslide, 2),
        "high_risk_locations": high_risk_count,
        "study_area": "New Juaben South Municipality, Ghana"
    }
    
    return results, summary


@router.post("/upload/coordinates", response_model=AnalysisResponse)
@limiter.limit("30/minute")
async def analyze_coordinates(
    request: Request,
    coord_request: CoordinatesRequest,
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Analyze flood and landslide susceptibility for user-provided coordinates.
    
    Accepts a list of latitude/longitude coordinates and returns susceptibility
    analysis results for each location.
    
    - **coordinates**: List of coordinate objects with latitude, longitude, and optional name
    - **Maximum**: 10,000 coordinates per request
    
    Returns susceptibility scores and risk classifications for each location.
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
    results, summary = process_coordinates(coord_request.coordinates)
    
    # Add user info to summary if authenticated
    if current_user:
        summary["analyzed_by"] = current_user.email
    
    return AnalysisResponse(
        session_id=session_id,
        timestamp=datetime.utcnow().isoformat(),
        location_count=len(results),
        results=results,
        summary=summary
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
    
    Accepts a GeoJSON file containing Point features and returns susceptibility
    analysis for each point.
    
    - **file**: GeoJSON file (.geojson or .json)
    - **Maximum file size**: 50 MB
    - **Maximum points**: 10,000
    
    Returns susceptibility scores and risk classifications for each point.
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
    
    # Read file content with size limit
    try:
        content = await file.read()
        
        # Check file size
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
    
    # Extract coordinates from GeoJSON
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
            # GeoJSON uses [longitude, latitude] order
            # Sanitize name if present
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
    results, summary = process_coordinates(coordinates)
    
    # Add file info to summary
    summary["source_file"] = safe_filename
    if current_user:
        summary["analyzed_by"] = current_user.email
    
    return AnalysisResponse(
        session_id=session_id,
        timestamp=datetime.utcnow().isoformat(),
        location_count=len(results),
        results=results,
        summary=summary
    )


@router.get("/upload/study-area")
async def get_study_area_bounds():
    """
    Get the bounding box of the current study area for reference.
    
    Returns the geographic bounds of the currently configured study area
    for use in coordinate validation and map centering.
    
    Note: Researchers can define custom study areas using the /api/v1/study-area/define endpoint.
    """
    study_area = get_active_study_area()
    
    return {
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



@router.get("/upload/limits")
async def get_upload_limits():
    """
    Get the current upload limits for the API.
    
    Returns maximum coordinates per request and file size limits.
    """
    return {
        "max_coordinates_per_request": MAX_COORDINATES,
        "max_file_size_mb": MAX_FILE_SIZE // (1024 * 1024),
        "max_file_size_bytes": MAX_FILE_SIZE,
        "allowed_file_types": [".geojson", ".json"],
        "rate_limits": {
            "coordinates_endpoint": "30 requests/minute",
            "geojson_endpoint": "10 requests/minute"
        }
    }
