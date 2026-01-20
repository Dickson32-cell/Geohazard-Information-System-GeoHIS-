"""Upload API endpoints for GeoHIS with Demo Mode"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Request
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import json, uuid, hashlib
from datetime import datetime
from decouple import config
import logging

from app.middleware.rate_limit import limiter
from app.middleware.security import sanitize_filename
from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.routes.study_area import get_active_study_area, is_point_in_study_area

try:
    from app.services.geospatial_v2 import get_geospatial_service, get_data_manager
    USE_V2_SERVICE = True
except ImportError:
    USE_V2_SERVICE = False

logger = logging.getLogger(__name__)
router = APIRouter()

MAX_COORDINATES = config("MAX_COORDINATES_PER_REQUEST", default=10000, cast=int)
MAX_FILE_SIZE = config("MAX_UPLOAD_SIZE_MB", default=50, cast=int) * 1024 * 1024

def calculate_demo_flood_susceptibility(lat, lon):
    coord_str = f"{lat:.6f},{lon:.6f}"
    hash_val = int(hashlib.md5(coord_str.encode()).hexdigest()[:8], 16)
    tropical_factor = max(0, 1 - abs(abs(lat) - 6.07) / 10) * 25
    center_lat, center_lon = 6.07, -0.24
    dist_factor = ((lat - center_lat)**2 + (lon - center_lon)**2) ** 0.5
    elevation_effect = max(0, 30 - dist_factor * 200)
    variation = (hash_val % 30) - 15
    return max(0, min(100, 35 + tropical_factor + elevation_effect + variation))

def calculate_demo_landslide_susceptibility(lat, lon):
    coord_str = f"{lon:.6f},{lat:.6f}"
    hash_val = int(hashlib.md5(coord_str.encode()).hexdigest()[:8], 16)
    center_lat, center_lon = 6.07, -0.24
    dist_from_center = ((lat - center_lat)**2 + (lon - center_lon)**2) ** 0.5
    slope_effect = min(40, dist_from_center * 300)
    variation = (hash_val % 25) - 12
    return max(0, min(100, 25 + slope_effect + variation))

class CoordinateInput(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    name: Optional[str] = Field(None, max_length=255)

class CoordinatesRequest(BaseModel):
    coordinates: List[CoordinateInput]

class SusceptibilityResult(BaseModel):
    latitude: float
    longitude: float
    name: Optional[str] = None
    flood_susceptibility: Optional[float] = None
    flood_class: str
    landslide_susceptibility: Optional[float] = None
    landslide_class: str
    combined_risk: str
    in_study_area: bool
    has_real_data: bool = False
    data_quality: Optional[Dict[str, Any]] = None

class AnalysisResponse(BaseModel):
    session_id: str
    timestamp: str
    location_count: int
    results: List[SusceptibilityResult]
    summary: dict
    data_status: Optional[dict] = None

def classify_susceptibility(value):
    if value is None: return "Data Required"
    if value < 20: return "Very Low"
    elif value < 40: return "Low"
    elif value < 60: return "Moderate"
    elif value < 80: return "High"
    else: return "Very High"

def calculate_combined_risk(flood, landslide):
    if flood is None and landslide is None: return "Data Required"
    max_risk = max(flood or 0, landslide or 0)
    if max_risk >= 80: return "Critical"
    elif max_risk >= 60: return "High"
    elif max_risk >= 40: return "Moderate"
    elif max_risk >= 20: return "Low"
    else: return "Very Low"

def process_coordinates(coordinates):
    results = []
    has_any_real_data = False
    data_status = None
    
    if USE_V2_SERVICE:
        service = get_geospatial_service()
        data_status = service.get_data_status()
    
    for coord in coordinates:
        flood_sus = None
        landslide_sus = None
        has_real_data = False
        data_quality = {"mode": "demo"}
        
        if USE_V2_SERVICE:
            try:
                flood_result = service.calculate_flood_susceptibility(coord.latitude, coord.longitude)
                landslide_result = service.calculate_landslide_susceptibility(coord.latitude, coord.longitude)
                flood_sus = flood_result.get('susceptibility_index')
                landslide_sus = landslide_result.get('susceptibility_index')
                has_real_data = flood_result.get('has_real_data', False) or landslide_result.get('has_real_data', False)
                if has_real_data:
                    has_any_real_data = True
                    data_quality = flood_result.get('data_quality', {})
            except Exception as e:
                logger.error(f"Error: {e}")
        
        if not has_real_data:
            flood_sus = calculate_demo_flood_susceptibility(coord.latitude, coord.longitude)
            landslide_sus = calculate_demo_landslide_susceptibility(coord.latitude, coord.longitude)
            data_quality = {"mode": "demo", "note": "Using demo calculations. Upload raster data for real analysis."}
        
        results.append(SusceptibilityResult(
            latitude=coord.latitude, longitude=coord.longitude, name=coord.name,
            flood_susceptibility=round(flood_sus, 2) if flood_sus else None,
            flood_class=classify_susceptibility(flood_sus),
            landslide_susceptibility=round(landslide_sus, 2) if landslide_sus else None,
            landslide_class=classify_susceptibility(landslide_sus),
            combined_risk=calculate_combined_risk(flood_sus, landslide_sus),
            in_study_area=is_point_in_study_area(coord.latitude, coord.longitude),
            has_real_data=has_real_data, data_quality=data_quality
        ))
    
    valid_flood = [r for r in results if r.flood_susceptibility is not None]
    valid_landslide = [r for r in results if r.landslide_susceptibility is not None]
    
    summary = {
        "locations_analyzed": len(results),
        "in_study_area": sum(1 for r in results if r.in_study_area),
        "outside_study_area": sum(1 for r in results if not r.in_study_area),
        "results_with_real_data": sum(1 for r in results if r.has_real_data),
        "average_flood_susceptibility": round(sum(r.flood_susceptibility for r in valid_flood) / len(valid_flood), 2) if valid_flood else None,
        "average_landslide_susceptibility": round(sum(r.landslide_susceptibility for r in valid_landslide) / len(valid_landslide), 2) if valid_landslide else None,
        "high_risk_locations": sum(1 for r in results if r.combined_risk in ["High", "Critical"]),
        "study_area": get_active_study_area().name,
        "analysis_mode": "Real Raster Data" if has_any_real_data else "Demo Mode"
    }
    
    if not has_any_real_data:
        summary["demo_mode_message"] = "Running in DEMO MODE. Upload raster data via /api/v1/data/upload or generate sample data via /api/v1/data/generate-sample"
    
    return results, summary, data_status

@router.post("/upload/coordinates", response_model=AnalysisResponse)
@limiter.limit("30/minute")
async def analyze_coordinates(request: Request, coord_request: CoordinatesRequest, current_user: Optional[User] = Depends(get_current_user)):
    if len(coord_request.coordinates) > MAX_COORDINATES:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_COORDINATES} coordinates per request")
    if len(coord_request.coordinates) == 0:
        raise HTTPException(status_code=400, detail="At least one coordinate is required")
    
    results, summary, data_status = process_coordinates(coord_request.coordinates)
    if current_user: summary["analyzed_by"] = current_user.email
    
    return AnalysisResponse(session_id=str(uuid.uuid4()), timestamp=datetime.utcnow().isoformat(),
                           location_count=len(results), results=results, summary=summary, data_status=data_status)

@router.post("/upload/geojson", response_model=AnalysisResponse)
@limiter.limit("10/minute")
async def analyze_geojson(request: Request, file: UploadFile = File(...), current_user: Optional[User] = Depends(get_current_user)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename required")
    
    safe_filename = sanitize_filename(file.filename)
    if not safe_filename.endswith(('.geojson', '.json')):
        raise HTTPException(status_code=400, detail="File must be GeoJSON format")
    
    try:
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large")
        geojson = json.loads(content.decode('utf-8'))
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format")
    
    coordinates = []
    features = geojson.get("features", [geojson]) if geojson.get("type") in ["FeatureCollection", "Feature"] else []
    
    for feature in features:
        geometry = feature.get("geometry", {})
        if geometry.get("type") == "Point":
            coords = geometry.get("coordinates", [])
            if len(coords) >= 2:
                name = feature.get("properties", {}).get("name", "")[:255] if feature.get("properties", {}).get("name") else None
                coordinates.append(CoordinateInput(longitude=coords[0], latitude=coords[1], name=name))
    
    if not coordinates:
        raise HTTPException(status_code=400, detail="No valid Point features found")
    if len(coordinates) > MAX_COORDINATES:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_COORDINATES} points per file")
    
    results, summary, data_status = process_coordinates(coordinates)
    summary["source_file"] = safe_filename
    if current_user: summary["analyzed_by"] = current_user.email
    
    return AnalysisResponse(session_id=str(uuid.uuid4()), timestamp=datetime.utcnow().isoformat(),
                           location_count=len(results), results=results, summary=summary, data_status=data_status)

@router.get("/upload/study-area")
async def get_study_area_bounds():
    study_area = get_active_study_area()
    response = {
        "name": study_area.name, "region": study_area.region or "Not specified",
        "country": study_area.country or "Not specified",
        "bounds": {"min_latitude": study_area.bounds.min_latitude, "max_latitude": study_area.bounds.max_latitude,
                  "min_longitude": study_area.bounds.min_longitude, "max_longitude": study_area.bounds.max_longitude},
        "center": study_area.get_center(),
        "limits": {"max_coordinates_per_request": MAX_COORDINATES, "max_file_size_mb": MAX_FILE_SIZE // (1024 * 1024)}
    }
    if USE_V2_SERVICE:
        response["data_status"] = get_geospatial_service().get_data_status()['summary']
    return response

@router.get("/upload/limits")
async def get_upload_limits():
    response = {"max_coordinates_per_request": MAX_COORDINATES, "max_file_size_mb": MAX_FILE_SIZE // (1024 * 1024),
                "allowed_file_types": [".geojson", ".json"]}
    if USE_V2_SERVICE:
        response["data_status"] = get_geospatial_service().get_data_status()
    return response
