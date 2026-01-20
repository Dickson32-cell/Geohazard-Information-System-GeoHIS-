"""
Job Status Routes for GeoHIS

Endpoints for checking background job status and retrieving results.
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

from app.auth.dependencies import get_current_user, get_current_active_user
from app.auth.models import User
from app.tasks.analysis_tasks import analyze_large_dataset, get_job_status

router = APIRouter(prefix="/jobs", tags=["jobs"])


class JobSubmission(BaseModel):
    """Request to submit a large analysis job."""
    coordinates: List[Dict[str, Any]]


class JobResponse(BaseModel):
    """Response after submitting a job."""
    job_id: str
    status: str
    message: str
    submitted_at: str


class JobStatusResponse(BaseModel):
    """Response with job status."""
    job_id: str
    status: str
    progress: float
    processed: Optional[int] = None
    total: Optional[int] = None
    updated_at: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


@router.post("/submit", response_model=JobResponse)
async def submit_analysis_job(
    job_data: JobSubmission,
    current_user: User = Depends(get_current_active_user)
):
    """
    Submit a large analysis job for background processing.
    
    Use this endpoint for datasets larger than 10,000 coordinates.
    The job will be processed in the background and you can check
    its status using the job ID.
    
    - **coordinates**: List of coordinate objects
    
    Returns a job ID that can be used to check status.
    """
    if len(job_data.coordinates) == 0:
        raise HTTPException(
            status_code=400,
            detail="At least one coordinate is required"
        )
    
    if len(job_data.coordinates) > 100000:
        raise HTTPException(
            status_code=400,
            detail="Maximum 100,000 coordinates per job"
        )
    
    # Submit to Celery
    task = analyze_large_dataset.delay(
        job_data.coordinates,
        current_user.email
    )
    
    return JobResponse(
        job_id=task.id,
        status="submitted",
        message=f"Job submitted for {len(job_data.coordinates)} coordinates",
        submitted_at=datetime.utcnow().isoformat()
    )


@router.get("/{job_id}", response_model=JobStatusResponse)
async def check_job_status(
    job_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Check the status of a background analysis job.
    
    - **job_id**: The job ID returned when submitting the job
    
    Returns the current status, progress, and result if completed.
    """
    status = get_job_status(job_id)
    
    if not status:
        raise HTTPException(
            status_code=404,
            detail="Job not found or expired"
        )
    
    return JobStatusResponse(
        job_id=status.get("job_id", job_id),
        status=status.get("status", "unknown"),
        progress=status.get("progress", 0),
        processed=status.get("processed"),
        total=status.get("total"),
        updated_at=status.get("updated_at"),
        result=status.get("result"),
        error=status.get("error")
    )


@router.get("/{job_id}/result")
async def get_job_result(
    job_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Get the full result of a completed job.
    
    - **job_id**: The job ID returned when submitting the job
    
    Returns the full analysis results if the job is completed.
    """
    status = get_job_status(job_id)
    
    if not status:
        raise HTTPException(
            status_code=404,
            detail="Job not found or expired"
        )
    
    if status.get("status") != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Job is not completed. Current status: {status.get('status')}"
        )
    
    result = status.get("result")
    if not result:
        raise HTTPException(
            status_code=404,
            detail="Job result not found"
        )
    
    return result
