"""
GeoHIS Project-Aware Analysis Routes

All analysis operations require a project context.
Results are automatically saved to the project.

NOTE: Place this file in backend/app/routes/project_analysis.py
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
import pandas as pd
import json
import uuid
import os
import hashlib
from io import BytesIO

from app.database import get_db
from app.models.models import (
    Project, ProjectDataset, ProjectAnalysis, ProjectExport,
    User, AnalysisStatus, HazardType, AnalysisMethod
)
from app.auth.dependencies import get_current_user
from app.analysis.enhanced_engine import (
    EnhancedAnalysisEngine, 
    DataQualityChecker,
    PublicationExporter
)

router = APIRouter(prefix="/projects/{project_id}/analysis", tags=["project-analysis"])

# Configuration
UPLOAD_DIR = "data/uploads"
RESULTS_DIR = "data/results"
EXPORTS_DIR = "data/exports"


# =============================================================================
# SCHEMAS
# =============================================================================

class AnalysisRequest(BaseModel):
    """Request to run a new analysis"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    hazard_type: str = Field(..., pattern="^(flood|landslide)$")
    method: str = Field(default="ahp", pattern="^(ahp|frequency_ratio|ensemble)$")
    dataset_id: Optional[str] = None
    custom_weights: Optional[dict] = None
    run_sensitivity: bool = True
    run_uncertainty: bool = True
    n_bootstrap: int = Field(default=500, ge=100, le=2000)
    random_seed: Optional[int] = None


class CoordinateInput(BaseModel):
    """Single coordinate for manual analysis"""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    name: Optional[str] = None


class ManualAnalysisRequest(BaseModel):
    """Request for manual coordinate analysis"""
    coordinates: List[CoordinateInput]
    hazard_type: str = Field(..., pattern="^(flood|landslide)$")
    save_to_project: bool = True


class AnalysisResponse(BaseModel):
    """Response after starting an analysis"""
    analysis_id: str
    status: str
    message: str


class AnalysisResultResponse(BaseModel):
    """Full analysis result"""
    id: str
    name: str
    hazard_type: str
    method: str
    status: str
    results_summary: Optional[dict]
    validation_metrics: Optional[dict]
    sensitivity_results: Optional[dict]
    uncertainty_results: Optional[dict]
    parameters: dict
    created_at: datetime
    completed_at: Optional[datetime]


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def verify_project_access(project_id: str, user: User, db: Session) -> Project:
    """Verify user has access to the project."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or access denied"
        )
    
    return project


def run_analysis_task(
    analysis_id: str,
    project_id: str,
    data: pd.DataFrame,
    hazard_type: str,
    method: str,
    weights: Optional[dict],
    run_sensitivity: bool,
    run_uncertainty: bool,
    n_bootstrap: int,
    random_seed: int,
    db: Session
) -> None:
    """Background task to run analysis."""
    try:
        # Update status to running
        analysis = db.query(ProjectAnalysis).filter(ProjectAnalysis.id == analysis_id).first()
        if analysis is None:
            return
            
        analysis.status = AnalysisStatus.running
        analysis.started_at = datetime.utcnow()
        db.commit()
        
        # Run analysis
        engine = EnhancedAnalysisEngine(project_id)
        results = engine.run_full_analysis(
            data=data,
            hazard_type=hazard_type,
            method=method,
            weights=weights,
            run_sensitivity=run_sensitivity,
            run_uncertainty=run_uncertainty,
            n_bootstrap=n_bootstrap,
            random_seed=random_seed
        )
        
        # Update analysis record
        analysis.status = AnalysisStatus.completed
        analysis.completed_at = datetime.utcnow()
        analysis.results_summary = results.get('results_summary', {})
        analysis.validation_metrics = results.get('validation_metrics', {})
        analysis.sensitivity_results = {
            'oat': results.get('sensitivity_oat'),
            'monte_carlo': results.get('sensitivity_mc')
        }
        analysis.uncertainty_results = results.get('uncertainty')
        
        # Save full results to file
        os.makedirs(RESULTS_DIR, exist_ok=True)
        results_path = f"{RESULTS_DIR}/{analysis_id}.json"
        with open(results_path, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        analysis.results_file_path = results_path
        
        db.commit()
        
    except Exception as e:
        analysis = db.query(ProjectAnalysis).filter(ProjectAnalysis.id == analysis_id).first()
        if analysis:
            analysis.status = AnalysisStatus.failed
            analysis.error_message = str(e)
            db.commit()


def classify_susceptibility(score: float) -> str:
    """Classify susceptibility score."""
    if score < 20:
        return "Very Low"
    elif score < 40:
        return "Low"
    elif score < 60:
        return "Moderate"
    elif score < 80:
        return "High"
    else:
        return "Very High"


def classify_combined_risk(flood: float, landslide: float) -> str:
    """Classify combined risk level."""
    combined = max(flood, landslide)
    if combined >= 80:
        return "Critical"
    elif combined >= 60:
        return "High"
    elif combined >= 40:
        return "Moderate"
    elif combined >= 20:
        return "Low"
    else:
        return "Very Low"


# =============================================================================
# DATASET UPLOAD ENDPOINT
# =============================================================================

@router.post("/upload", response_model=dict)
async def upload_dataset(
    project_id: str,
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    lat_column: str = Form("latitude"),
    lon_column: str = Form("longitude"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a dataset (CSV or GeoJSON) to a project."""
    project = verify_project_access(project_id, current_user, db)
    
    # Validate file type
    filename = file.filename or ""
    if not filename.endswith(('.csv', '.geojson', '.json')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV and GeoJSON files are supported"
        )
    
    # Read file
    content = await file.read()
    file_hash = hashlib.sha256(content).hexdigest()
    
    # Parse file
    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(BytesIO(content))
            file_type = 'csv'
        else:
            geojson = json.loads(content.decode())
            features = geojson.get('features', [])
            records = []
            for f in features:
                props = f.get('properties', {})
                coords = f.get('geometry', {}).get('coordinates', [])
                if len(coords) >= 2:
                    props[lon_column] = coords[0]
                    props[lat_column] = coords[1]
                records.append(props)
            df = pd.DataFrame(records)
            file_type = 'geojson'
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error parsing file: {str(e)}"
        )
    
    # Run data quality check
    quality_checker = DataQualityChecker(df, lat_column, lon_column)
    quality_report = quality_checker.check_all()
    
    # Save file
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = f"{UPLOAD_DIR}/{project_id}_{uuid.uuid4().hex[:8]}_{filename}"
    with open(file_path, 'wb') as f:
        f.write(content)
    
    # Create dataset record
    dataset = ProjectDataset(
        project_id=project.id,
        name=name or filename,
        description=description,
        file_type=file_type,
        file_path=file_path,
        file_size_bytes=len(content),
        file_hash=file_hash,
        record_count=len(df),
        column_names=list(df.columns),
        coordinate_columns={'lat': lat_column, 'lon': lon_column},
        bounds=quality_report.coordinate_stats,
        quality_score=quality_report.quality_score,
        quality_report={
            'is_valid': quality_report.is_valid,
            'issues': [{'type': i.issue_type, 'severity': i.severity, 'message': i.message} 
                      for i in quality_report.issues],
            'warnings': [{'type': w.issue_type, 'message': w.message} 
                        for w in quality_report.warnings],
            'recommendations': quality_report.recommendations
        }
    )
    
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    
    return {
        'dataset_id': str(dataset.id),
        'name': dataset.name,
        'record_count': dataset.record_count,
        'quality_score': dataset.quality_score,
        'quality_report': dataset.quality_report,
        'is_valid': quality_report.is_valid
    }


# =============================================================================
# ANALYSIS ENDPOINTS
# =============================================================================

@router.post("/run", response_model=AnalysisResponse)
async def run_analysis(
    project_id: str,
    request: AnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Run a susceptibility analysis on project data."""
    project = verify_project_access(project_id, current_user, db)
    
    # Get dataset
    if not request.dataset_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please specify a dataset_id"
        )
    
    dataset = db.query(ProjectDataset).filter(
        ProjectDataset.id == request.dataset_id,
        ProjectDataset.project_id == project.id
    ).first()
    
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
    
    # Load data
    if dataset.file_type == 'csv':
        df = pd.read_csv(dataset.file_path)
    else:
        with open(dataset.file_path) as f:
            data = json.load(f)
        df = pd.DataFrame(data.get('features', []))
    
    # Generate random seed if not provided
    random_seed = request.random_seed or int(datetime.utcnow().timestamp()) % 100000
    
    # Create analysis record
    analysis = ProjectAnalysis(
        project_id=project.id,
        dataset_id=uuid.UUID(request.dataset_id),
        name=request.name,
        description=request.description,
        hazard_type=HazardType[request.hazard_type],
        method=AnalysisMethod[request.method],
        parameters={
            'custom_weights': request.custom_weights,
            'run_sensitivity': request.run_sensitivity,
            'run_uncertainty': request.run_uncertainty,
            'n_bootstrap': request.n_bootstrap
        },
        random_seed=random_seed,
        status=AnalysisStatus.pending
    )
    
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    
    # Start background task
    background_tasks.add_task(
        run_analysis_task,
        analysis_id=str(analysis.id),
        project_id=project_id,
        data=df,
        hazard_type=request.hazard_type,
        method=request.method,
        weights=request.custom_weights,
        run_sensitivity=request.run_sensitivity,
        run_uncertainty=request.run_uncertainty,
        n_bootstrap=request.n_bootstrap,
        random_seed=random_seed,
        db=db
    )
    
    return AnalysisResponse(
        analysis_id=str(analysis.id),
        status='pending',
        message='Analysis started. Check status using the analysis_id.'
    )


@router.get("/{analysis_id}", response_model=AnalysisResultResponse)
async def get_analysis_result(
    project_id: str,
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analysis result by ID."""
    project = verify_project_access(project_id, current_user, db)
    
    analysis = db.query(ProjectAnalysis).filter(
        ProjectAnalysis.id == analysis_id,
        ProjectAnalysis.project_id == project.id
    ).first()
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )
    
    return AnalysisResultResponse(
        id=str(analysis.id),
        name=analysis.name,
        hazard_type=analysis.hazard_type.value,
        method=analysis.method.value,
        status=analysis.status.value,
        results_summary=analysis.results_summary,
        validation_metrics=analysis.validation_metrics,
        sensitivity_results=analysis.sensitivity_results,
        uncertainty_results=analysis.uncertainty_results,
        parameters=analysis.parameters,
        created_at=analysis.created_at,
        completed_at=analysis.completed_at
    )


@router.get("/", response_model=List[AnalysisResultResponse])
async def list_project_analyses(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all analyses for a project."""
    project = verify_project_access(project_id, current_user, db)
    
    analyses = db.query(ProjectAnalysis).filter(
        ProjectAnalysis.project_id == project.id
    ).order_by(ProjectAnalysis.created_at.desc()).all()
    
    return [
        AnalysisResultResponse(
            id=str(a.id),
            name=a.name,
            hazard_type=a.hazard_type.value,
            method=a.method.value,
            status=a.status.value,
            results_summary=a.results_summary,
            validation_metrics=a.validation_metrics,
            sensitivity_results=a.sensitivity_results,
            uncertainty_results=a.uncertainty_results,
            parameters=a.parameters,
            created_at=a.created_at,
            completed_at=a.completed_at
        ) for a in analyses
    ]


@router.post("/manual", response_model=dict)
async def analyze_manual_coordinates(
    project_id: str,
    request: ManualAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze susceptibility for manually entered coordinates."""
    project = verify_project_access(project_id, current_user, db)
    
    # Convert coordinates to DataFrame
    coords_data = []
    for coord in request.coordinates:
        coords_data.append({
            'latitude': coord.latitude,
            'longitude': coord.longitude,
            'name': coord.name or f"Point {len(coords_data)+1}"
        })
    
    df = pd.DataFrame(coords_data)
    
    # Run quick analysis (simplified)
    engine = EnhancedAnalysisEngine(project_id)
    results = engine.run_full_analysis(
        data=df,
        hazard_type=request.hazard_type,
        method='ahp',  # Default method
        run_sensitivity=False,
        run_uncertainty=False
    )
    
    # Format response
    response = {
        'hazard_type': request.hazard_type,
        'coordinates_analyzed': len(request.coordinates),
        'results': []
    }
    
    for i, coord in enumerate(request.coordinates):
        score = results.get('results_summary', {}).get('predictions', [0])[i] if i < len(results.get('results_summary', {}).get('predictions', [])) else 0
        classification = classify_susceptibility(score)
        
        response['results'].append({
            'name': coord.name or f"Point {i+1}",
            'latitude': coord.latitude,
            'longitude': coord.longitude,
            'susceptibility_score': score,
            'classification': classification
        })
    
    # Save to project if requested
    if request.save_to_project:
        analysis = ProjectAnalysis(
            project_id=project.id,
            name=f"Manual {request.hazard_type.title()} Analysis",
            description=f"Analysis of {len(request.coordinates)} manual coordinates",
            hazard_type=HazardType[request.hazard_type],
            method=AnalysisMethod.ahp,
            parameters={'manual_coordinates': True},
            status=AnalysisStatus.completed,
            results_summary=response
        )
        db.add(analysis)
        db.commit()
        response['analysis_id'] = str(analysis.id)
    
    return response


@router.get("/datasets/", response_model=List[dict])
async def list_project_datasets(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all datasets for a project."""
    project = verify_project_access(project_id, current_user, db)
    
    datasets = db.query(ProjectDataset).filter(
        ProjectDataset.project_id == project.id
    ).order_by(ProjectDataset.created_at.desc()).all()
    
    return [
        {
            'id': str(d.id),
            'name': d.name,
            'description': d.description,
            'file_type': d.file_type,
            'record_count': d.record_count,
            'quality_score': d.quality_score,
            'created_at': d.created_at
        } for d in datasets
    ]


@router.delete("/datasets/{dataset_id}")
async def delete_dataset(
    project_id: str,
    dataset_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a dataset from a project."""
    project = verify_project_access(project_id, current_user, db)
    
    dataset = db.query(ProjectDataset).filter(
        ProjectDataset.id == dataset_id,
        ProjectDataset.project_id == project.id
    ).first()
    
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
    
    # Delete file if exists
    if os.path.exists(dataset.file_path):
        os.remove(dataset.file_path)
    
    # Delete record
    db.delete(dataset)
    db.commit()
    
    return {"message": "Dataset deleted successfully"}