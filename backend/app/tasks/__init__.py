"""
GeoHIS Background Tasks Package

Provides Celery-based background task processing for long-running operations.
"""

from .celery_app import celery_app
from .analysis_tasks import analyze_large_dataset, get_job_status

__all__ = [
    "celery_app",
    "analyze_large_dataset",
    "get_job_status",
]
