"""
Study Area Configuration Routes for GeoHIS

Allows researchers to define custom study areas for their analysis.
This enables the platform to be used for any geographic region, not just the default study area.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any
from datetime import datetime

router = APIRouter(prefix="/api/v1/study-area", tags=["study-area"])


# ============== Schemas ==============

class StudyAreaBounds(BaseModel):
    """Geographic bounding box for a study area."""
    min_latitude: float = Field(..., ge=-90, le=90, description="Southern boundary")
    max_latitude: float = Field(..., ge=-90, le=90, description="Northern boundary")
    min_longitude: float = Field(..., ge=-180, le=180, description="Western boundary")
    max_longitude: float = Field(..., ge=-180, le=180, description="Eastern boundary")
    
    @field_validator('max_latitude')
    @classmethod
    def validate_latitude_range(cls, v, info):
        if 'min_latitude' in info.data and v <= info.data['min_latitude']:
            raise ValueError('max_latitude must be greater than min_latitude')
        return v
    
    @field_validator('max_longitude')
    @classmethod
    def validate_longitude_range(cls, v, info):
        if 'min_longitude' in info.data and v <= info.data['min_longitude']:
            raise ValueError('max_longitude must be greater than min_longitude')
        return v


class StudyAreaConfig(BaseModel):
    """Complete study area configuration."""
    name: str = Field(..., min_length=1, max_length=255, description="Name of the study area")
    description: Optional[str] = Field(None, max_length=1000, description="Description of the study area")
    bounds: StudyAreaBounds
    country: Optional[str] = Field(None, max_length=100)
    region: Optional[str] = Field(None, max_length=100)
    area_km2: Optional[float] = Field(None, ge=0, description="Area in square kilometers")
    
    def get_center(self) -> Dict[str, float]:
        """Calculate the center point of the study area."""
        return {
            "latitude": (self.bounds.min_latitude + self.bounds.max_latitude) / 2,
            "longitude": (self.bounds.min_longitude + self.bounds.max_longitude) / 2
        }
    
    def contains_point(self, lat: float, lon: float) -> bool:
        """Check if a point is within this study area."""
        return (
            self.bounds.min_latitude <= lat <= self.bounds.max_latitude and
            self.bounds.min_longitude <= lon <= self.bounds.max_longitude
        )


class StudyAreaResponse(BaseModel):
    """Response containing study area details."""
    config: StudyAreaConfig
    center: Dict[str, float]
    created_at: str


# ============== In-Memory Storage ==============
# For a research platform, we store the current session's study area in memory
# In production, this could be stored in a database per user session

_current_study_area: Optional[StudyAreaConfig] = None

# Default study area (New Juaben South Municipality)
DEFAULT_STUDY_AREA = StudyAreaConfig(
    name="New Juaben South Municipality",
    description="Default study area for GeoHIS - Eastern Region, Ghana",
    bounds=StudyAreaBounds(
        min_latitude=6.02,
        max_latitude=6.12,
        min_longitude=-0.30,
        max_longitude=-0.18
    ),
    country="Ghana",
    region="Eastern Region",
    area_km2=110
)


# ============== Endpoints ==============

@router.post("/define", response_model=StudyAreaResponse)
async def define_study_area(config: StudyAreaConfig):
    """
    Define a custom study area for analysis.
    
    Researchers can define their own study area by providing:
    - **name**: Name of the study area (required)
    - **bounds**: Geographic bounding box with min/max lat/lon (required)
    - **country**: Country name (optional)
    - **region**: Region/state name (optional)
    - **area_km2**: Area in square kilometers (optional)
    
    The defined study area will be used for subsequent analysis requests.
    Points outside this area will be flagged as "outside study area".
    """
    global _current_study_area
    _current_study_area = config
    
    return StudyAreaResponse(
        config=config,
        center=config.get_center(),
        created_at=datetime.utcnow().isoformat()
    )


@router.get("/current", response_model=StudyAreaResponse)
async def get_current_study_area():
    """
    Get the currently configured study area.
    
    Returns the study area that will be used for analysis.
    If no custom study area has been defined, returns the default
    (New Juaben South Municipality, Ghana).
    """
    study_area = _current_study_area or DEFAULT_STUDY_AREA
    
    return StudyAreaResponse(
        config=study_area,
        center=study_area.get_center(),
        created_at=datetime.utcnow().isoformat()
    )


@router.delete("/reset")
async def reset_to_default():
    """
    Reset to the default study area (New Juaben South Municipality).
    
    Clears any custom study area configuration and reverts to the default.
    """
    global _current_study_area
    _current_study_area = None
    
    return {
        "message": "Study area reset to default",
        "default_area": DEFAULT_STUDY_AREA.name
    }


@router.get("/validate")
async def validate_coordinates(latitude: float, longitude: float):
    """
    Check if coordinates are within the current study area.
    
    Quick validation without running full analysis.
    """
    study_area = _current_study_area or DEFAULT_STUDY_AREA
    is_inside = study_area.contains_point(latitude, longitude)
    
    return {
        "latitude": latitude,
        "longitude": longitude,
        "study_area": study_area.name,
        "is_inside": is_inside,
        "bounds": {
            "min_latitude": study_area.bounds.min_latitude,
            "max_latitude": study_area.bounds.max_latitude,
            "min_longitude": study_area.bounds.min_longitude,
            "max_longitude": study_area.bounds.max_longitude
        }
    }


# ============== Helper Functions for Other Modules ==============

def get_active_study_area() -> StudyAreaConfig:
    """Get the currently active study area configuration."""
    return _current_study_area or DEFAULT_STUDY_AREA


def is_point_in_study_area(lat: float, lon: float) -> bool:
    """Check if a point is in the current study area."""
    study_area = get_active_study_area()
    return study_area.contains_point(lat, lon)


def get_study_area_bounds() -> Dict[str, float]:
    """Get the current study area bounds as a dictionary."""
    study_area = get_active_study_area()
    return {
        "min_lat": study_area.bounds.min_latitude,
        "max_lat": study_area.bounds.max_latitude,
        "min_lon": study_area.bounds.min_longitude,
        "max_lon": study_area.bounds.max_longitude
    }
