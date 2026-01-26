"""
GeoHIS Database Models - Enhanced with Project Management

This module defines all database models including the new Project system
that allows users to organize their analyses.
"""

from sqlalchemy import (
    Column, Integer, String, DateTime, Float, Enum, JSON, Date, 
    UUID, func, ForeignKey, Boolean, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import enum
from datetime import datetime
import uuid

Base = declarative_base()

# Determine ID type based on database
from app.config import settings
is_sqlite = settings.database_url.startswith("sqlite")
ID_TYPE = String(36) if is_sqlite else UUID(as_uuid=True)
DEFAULT_ID = str(uuid.uuid4()) if is_sqlite else uuid.uuid4


# =============================================================================
# ENUMS
# =============================================================================

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

class ProjectStatus(enum.Enum):
    active = "active"
    archived = "archived"
    completed = "completed"

class AnalysisStatus(enum.Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"

class AnalysisMethod(enum.Enum):
    ahp = "ahp"
    frequency_ratio = "frequency_ratio"
    topsis = "topsis"
    fuzzy_ahp = "fuzzy_ahp"
    ensemble = "ensemble"
    machine_learning = "machine_learning"


# =============================================================================
# USER MODEL
# =============================================================================

class User(Base):
    """User accounts for the system"""
    __tablename__ = "users"

    id = Column(ID_TYPE, primary_key=True, default=DEFAULT_ID)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    institution = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    last_login = Column(DateTime, nullable=True)
    
    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.username}>"


# =============================================================================
# PROJECT MANAGEMENT MODELS
# =============================================================================

class Project(Base):
    """Research Project - Container for all user analyses"""
    __tablename__ = "projects"

    id = Column(ID_TYPE, primary_key=True, default=DEFAULT_ID)
    owner_id = Column(ID_TYPE, ForeignKey("users.id"), nullable=False)
    
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    study_area_name = Column(String(255), nullable=True)
    study_area_bounds = Column(JSON, nullable=True)
    
    status = Column(Enum(ProjectStatus), default=ProjectStatus.active)
    tags = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    owner = relationship("User", back_populates="projects")
    analyses = relationship("ProjectAnalysis", back_populates="project", cascade="all, delete-orphan")
    datasets = relationship("ProjectDataset", back_populates="project", cascade="all, delete-orphan")
    exports = relationship("ProjectExport", back_populates="project", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Project {self.name}>"


class ProjectDataset(Base):
    """Uploaded datasets within a project"""
    __tablename__ = "project_datasets"

    id = Column(ID_TYPE, primary_key=True, default=DEFAULT_ID)
    project_id = Column(ID_TYPE, ForeignKey("projects.id"), nullable=False)
    
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    file_type = Column(String(50), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    file_hash = Column(String(64), nullable=True)
    
    record_count = Column(Integer, nullable=True)
    column_names = Column(JSON, nullable=True)
    coordinate_columns = Column(JSON, nullable=True)
    bounds = Column(JSON, nullable=True)
    
    quality_score = Column(Float, nullable=True)
    quality_report = Column(JSON, nullable=True)
    
    uploaded_at = Column(DateTime, server_default=func.now())
    
    project = relationship("Project", back_populates="datasets")
    
    def __repr__(self):
        return f"<ProjectDataset {self.name}>"


class ProjectAnalysis(Base):
    """Analysis runs within a project with full provenance"""
    __tablename__ = "project_analyses"

    id = Column(ID_TYPE, primary_key=True, default=DEFAULT_ID)
    project_id = Column(ID_TYPE, ForeignKey("projects.id"), nullable=False)
    dataset_id = Column(ID_TYPE, ForeignKey("project_datasets.id"), nullable=True)
    
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    hazard_type = Column(Enum(HazardType), nullable=False)
    method = Column(Enum(AnalysisMethod), nullable=False)
    
    parameters = Column(JSON, nullable=False)
    random_seed = Column(Integer, nullable=True)
    
    status = Column(Enum(AnalysisStatus), default=AnalysisStatus.pending)
    progress = Column(Float, default=0.0)
    error_message = Column(Text, nullable=True)
    
    results_summary = Column(JSON, nullable=True)
    results_file_path = Column(String(500), nullable=True)
    
    validation_metrics = Column(JSON, nullable=True)
    sensitivity_results = Column(JSON, nullable=True)
    uncertainty_results = Column(JSON, nullable=True)
    software_versions = Column(JSON, nullable=True)
    
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    project = relationship("Project", back_populates="analyses")
    dataset = relationship("ProjectDataset")
    
    def __repr__(self):
        return f"<ProjectAnalysis {self.name}>"


class ProjectExport(Base):
    """Exported files from a project"""
    __tablename__ = "project_exports"

    id = Column(ID_TYPE, primary_key=True, default=DEFAULT_ID)
    project_id = Column(ID_TYPE, ForeignKey("projects.id"), nullable=False)
    analysis_id = Column(ID_TYPE, ForeignKey("project_analyses.id"), nullable=True)
    
    export_type = Column(String(50), nullable=False)
    format = Column(String(20), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    
    project = relationship("Project", back_populates="exports")
    
    def __repr__(self):
        return f"<ProjectExport {self.export_type}>"


# =============================================================================
# EXISTING MODELS (Updated with Project relationships)
# =============================================================================

class HazardEvent(Base):
    """Historical hazard event records"""
    __tablename__ = "hazard_events"

    id = Column(ID_TYPE, primary_key=True, default=DEFAULT_ID)
    project_id = Column(ID_TYPE, ForeignKey("projects.id"), nullable=True)
    
    hazard_type = Column(Enum(HazardType), nullable=False)
    geometry = Column(String, nullable=False)
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

    id = Column(ID_TYPE, primary_key=True, default=DEFAULT_ID)
    project_id = Column(ID_TYPE, ForeignKey("projects.id"), nullable=True)
    analysis_id = Column(ID_TYPE, ForeignKey("project_analyses.id"), nullable=True)
    
    hazard_type = Column(Enum(HazardType), nullable=False)
    geometry = Column(String, nullable=False)
    risk_level = Column(Enum(RiskLevel), nullable=False)
    risk_score = Column(Float, nullable=False)
    analysis_date = Column(DateTime, server_default=func.now())
    analysis_parameters = Column(JSON, nullable=True)


class InfrastructureAsset(Base):
    """Critical infrastructure at risk"""
    __tablename__ = "infrastructure_assets"

    id = Column(ID_TYPE, primary_key=True, default=DEFAULT_ID)
    project_id = Column(ID_TYPE, ForeignKey("projects.id"), nullable=True)
    
    asset_type = Column(Enum(AssetType), nullable=False)
    name = Column(String, nullable=False)
    geometry = Column(String, nullable=False)
    population_served = Column(Integer, nullable=True)
    vulnerability_score = Column(Float, nullable=False)


class SpatialLayer(Base):
    """Reference spatial data layers"""
    __tablename__ = "spatial_layers"

    id = Column(ID_TYPE, primary_key=True, default=DEFAULT_ID)
    project_id = Column(ID_TYPE, ForeignKey("projects.id"), nullable=True)
    
    layer_name = Column(String, nullable=False)
    layer_type = Column(Enum(LayerType), nullable=False)
    file_path = Column(String, nullable=False)
    layer_metadata = Column(JSON, nullable=True)
    acquisition_date = Column(Date, nullable=False)
