"""
Analysis Background Tasks for GeoHIS

Long-running analysis tasks executed in the background.
"""

from celery import current_task
from typing import List, Dict, Any
import json
import uuid
from datetime import datetime
import logging

from .celery_app import celery_app
from app.cache import cache_set, cache_get, CACHE_TTL

logger = logging.getLogger(__name__)

# Job status storage prefix
JOB_PREFIX = "job:"


def classify_susceptibility(value: float) -> str:
    """Classify susceptibility value into risk category."""
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
    """Calculate combined multi-hazard risk level."""
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
    """Check if coordinates are within study area bounds."""
    return (6.02 <= lat <= 6.12) and (-0.30 <= lon <= -0.18)


def calculate_flood_susceptibility(lat: float, lon: float) -> float:
    """Calculate flood susceptibility for a location."""
    if not is_in_study_area(lat, lon):
        return 50.0
    
    base_susceptibility = 65.0
    lat_factor = (6.12 - lat) / 0.10 * 15
    lon_factor = abs(lon + 0.24) / 0.06 * 10
    
    susceptibility = base_susceptibility + lat_factor - lon_factor
    return max(0, min(100, susceptibility))


def calculate_landslide_susceptibility(lat: float, lon: float) -> float:
    """Calculate landslide susceptibility for a location."""
    if not is_in_study_area(lat, lon):
        return 30.0
    
    base_susceptibility = 25.0
    lat_factor = (lat - 6.02) / 0.10 * 35
    lon_factor = (lon + 0.18) / 0.12 * 15
    
    susceptibility = base_susceptibility + lat_factor + lon_factor
    return max(0, min(100, susceptibility))


@celery_app.task(bind=True, name="app.tasks.analysis_tasks.analyze_large_dataset")
def analyze_large_dataset(
    self,
    coordinates: List[Dict[str, Any]],
    user_email: str = None
) -> Dict[str, Any]:
    """
    Analyze a large dataset of coordinates in the background.
    
    Args:
        coordinates: List of coordinate dicts with lat, lon, and optional name
        user_email: Email of user who initiated the analysis
        
    Returns:
        Analysis results with session ID and summary
    """
    job_id = self.request.id or str(uuid.uuid4())
    total = len(coordinates)
    
    logger.info(f"Starting background analysis job {job_id} for {total} coordinates")
    
    # Update job status
    update_job_status(job_id, "processing", 0, total)
    
    results = []
    
    for i, coord in enumerate(coordinates):
        lat = coord.get("latitude", coord.get("lat"))
        lon = coord.get("longitude", coord.get("lon"))
        name = coord.get("name")
        
        if lat is None or lon is None:
            continue
        
        flood_sus = calculate_flood_susceptibility(lat, lon)
        landslide_sus = calculate_landslide_susceptibility(lat, lon)
        
        result = {
            "latitude": lat,
            "longitude": lon,
            "name": name,
            "flood_susceptibility": round(flood_sus, 2),
            "flood_class": classify_susceptibility(flood_sus),
            "landslide_susceptibility": round(landslide_sus, 2),
            "landslide_class": classify_susceptibility(landslide_sus),
            "combined_risk": calculate_combined_risk(flood_sus, landslide_sus),
            "in_study_area": is_in_study_area(lat, lon)
        }
        results.append(result)
        
        # Update progress every 100 items
        if (i + 1) % 100 == 0:
            progress = round((i + 1) / total * 100, 1)
            update_job_status(job_id, "processing", i + 1, total, progress)
            logger.debug(f"Job {job_id}: {progress}% complete")
    
    # Calculate summary
    in_area_count = sum(1 for r in results if r["in_study_area"])
    avg_flood = sum(r["flood_susceptibility"] for r in results) / len(results) if results else 0
    avg_landslide = sum(r["landslide_susceptibility"] for r in results) / len(results) if results else 0
    high_risk_count = sum(1 for r in results if r["combined_risk"] in ["High", "Critical"])
    
    summary = {
        "locations_analyzed": len(results),
        "in_study_area": in_area_count,
        "outside_study_area": len(results) - in_area_count,
        "average_flood_susceptibility": round(avg_flood, 2),
        "average_landslide_susceptibility": round(avg_landslide, 2),
        "high_risk_locations": high_risk_count,
        "study_area": "New Juaben South Municipality, Ghana"
    }
    
    if user_email:
        summary["analyzed_by"] = user_email
    
    final_result = {
        "session_id": job_id,
        "timestamp": datetime.utcnow().isoformat(),
        "location_count": len(results),
        "results": results,
        "summary": summary
    }
    
    # Mark job as complete
    update_job_status(job_id, "completed", total, total, 100, final_result)
    logger.info(f"Completed background analysis job {job_id}")
    
    return final_result


def update_job_status(
    job_id: str,
    status: str,
    processed: int,
    total: int,
    progress: float = None,
    result: Dict = None
):
    """
    Update the status of a background job.
    
    Args:
        job_id: Unique job identifier
        status: Current status (pending, processing, completed, failed)
        processed: Number of items processed
        total: Total number of items
        progress: Progress percentage (0-100)
        result: Final result (if completed)
    """
    job_data = {
        "job_id": job_id,
        "status": status,
        "processed": processed,
        "total": total,
        "progress": progress or round(processed / total * 100, 1) if total > 0 else 0,
        "updated_at": datetime.utcnow().isoformat()
    }
    
    if result:
        job_data["result"] = result
    
    # Store in cache (expire after 1 hour)
    cache_set(f"{JOB_PREFIX}{job_id}", job_data, ttl=3600)


def get_job_status(job_id: str) -> Dict[str, Any]:
    """
    Get the status of a background job.
    
    Args:
        job_id: Unique job identifier
        
    Returns:
        Job status dict or None if not found
    """
    job_data = cache_get(f"{JOB_PREFIX}{job_id}")
    
    if not job_data:
        # Try to get from Celery
        from celery.result import AsyncResult
        result = AsyncResult(job_id, app=celery_app)
        
        if result.state == "PENDING":
            return {"job_id": job_id, "status": "pending", "progress": 0}
        elif result.state == "FAILURE":
            return {"job_id": job_id, "status": "failed", "error": str(result.result)}
        elif result.state == "SUCCESS":
            return {"job_id": job_id, "status": "completed", "progress": 100, "result": result.result}
        else:
            return {"job_id": job_id, "status": result.state.lower(), "progress": 0}
    
    return job_data
