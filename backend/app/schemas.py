from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
import enum

class HazardType(str, enum.Enum):
    flood = "flood"
    landslide = "landslide"
    erosion = "erosion"

class Severity(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    extreme = "extreme"

class RiskLevel(str, enum.Enum):
    very_low = "very_low"
    low = "low"
    moderate = "moderate"
    high = "high"
    very_high = "very_high"

class AssetType(str, enum.Enum):
    school = "school"
    hospital = "hospital"
    road = "road"
    bridge = "bridge"
    building = "building"

class LayerType(str, enum.Enum):
    dem = "dem"
    slope = "slope"
    drainage = "drainage"
    landuse = "landuse"
    soil = "soil"
    geology = "geology"

# HazardEvent schemas
class HazardEventBase(BaseModel):
    hazard_type: HazardType
    geometry: str  # WKT string
    event_date: datetime
    severity: Severity
    description: Optional[str] = None
    damage_estimate: Optional[float] = None
    casualties: Optional[int] = None
    data_source: str

class HazardEventCreate(HazardEventBase):
    pass

class HazardEvent(HazardEventBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# HazardZone schemas
class HazardZoneBase(BaseModel):
    hazard_type: HazardType
    geometry: str  # WKT string
    risk_level: RiskLevel
    risk_score: float = Field(..., ge=0, le=100)
    analysis_parameters: Optional[dict] = None

class HazardZoneCreate(HazardZoneBase):
    pass

class HazardZone(HazardZoneBase):
    id: UUID
    analysis_date: datetime

    class Config:
        from_attributes = True

# InfrastructureAsset schemas
class InfrastructureAssetBase(BaseModel):
    asset_type: AssetType
    name: str
    geometry: str  # WKT string
    population_served: Optional[int] = None
    vulnerability_score: float = Field(..., ge=0, le=1)

class InfrastructureAssetCreate(InfrastructureAssetBase):
    pass

class InfrastructureAsset(InfrastructureAssetBase):
    id: UUID

    class Config:
        from_attributes = True

# SpatialLayer schemas
class SpatialLayerBase(BaseModel):
    layer_name: str
    layer_type: LayerType
    file_path: str
    layer_metadata: Optional[dict] = None
    acquisition_date: date

class SpatialLayerCreate(SpatialLayerBase):
    pass

class SpatialLayer(SpatialLayerBase):
    id: UUID

    class Config:
        from_attributes = True