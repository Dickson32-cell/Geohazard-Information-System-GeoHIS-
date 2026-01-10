from sqlalchemy import Column, Integer, String, DateTime, Float, Enum, JSON, Date, UUID, func
from sqlalchemy.ext.declarative import declarative_base
import enum
from datetime import datetime

Base = declarative_base()

class HazardType(enum.Enum):
    flood = "flood"
    landslide = "landslide"
    erosion = "erosion"

class Severity(enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    extreme = "extreme"

class RiskLevel(enum.Enum):
    very_low = "very_low"
    low = "low"
    moderate = "moderate"
    high = "high"
    very_high = "very_high"

class AssetType(enum.Enum):
    school = "school"
    hospital = "hospital"
    road = "road"
    bridge = "bridge"
    building = "building"

class LayerType(enum.Enum):
    dem = "dem"
    slope = "slope"
    drainage = "drainage"
    landuse = "landuse"
    soil = "soil"
    geology = "geology"

class HazardEvent(Base):
    """Historical hazard event records"""
    __tablename__ = "hazard_events"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    hazard_type = Column(Enum(HazardType), nullable=False)
    geometry = Column(String, nullable=False)  # WKT string
    event_date = Column(DateTime, nullable=False)
    severity = Column(Enum(Severity), nullable=False)
    description = Column(String, nullable=True)
    damage_estimate = Column(Float, nullable=True)
    casualties = Column(Integer, nullable=True)
    data_source = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class HazardZone(Base):
    """Computed hazard susceptibility zones"""
    __tablename__ = "hazard_zones"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    hazard_type = Column(Enum(HazardType), nullable=False)
    geometry = Column(String, nullable=False)  # WKT string
    risk_level = Column(Enum(RiskLevel), nullable=False)
    risk_score = Column(Float, nullable=False)  # 0-100
    analysis_date = Column(DateTime, server_default=func.now())
    analysis_parameters = Column(JSON, nullable=True)

class InfrastructureAsset(Base):
    """Critical infrastructure at risk"""
    __tablename__ = "infrastructure_assets"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    asset_type = Column(Enum(AssetType), nullable=False)
    name = Column(String, nullable=False)
    geometry = Column(String, nullable=False)  # WKT string
    population_served = Column(Integer, nullable=True)
    vulnerability_score = Column(Float, nullable=False)

class SpatialLayer(Base):
    """Reference spatial data layers"""
    __tablename__ = "spatial_layers"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    layer_name = Column(String, nullable=False)
    layer_type = Column(Enum(LayerType), nullable=False)
    file_path = Column(String, nullable=False)
    layer_metadata = Column(JSON, nullable=True)
    acquisition_date = Column(Date, nullable=False)