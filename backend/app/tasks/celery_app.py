"""
Celery Application Configuration for GeoHIS

Configures Celery for background task processing.
"""

from celery import Celery
from decouple import config

# Celery configuration
CELERY_BROKER_URL = config("CELERY_BROKER_URL", default="redis://localhost:6379/1")
CELERY_RESULT_BACKEND = config("CELERY_RESULT_BACKEND", default="redis://localhost:6379/2")

# Create Celery app
celery_app = Celery(
    "geohis",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
    include=["app.tasks.analysis_tasks"]
)

# Celery configuration
celery_app.conf.update(
    # Task settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    
    # Task result settings
    result_expires=3600,  # Results expire after 1 hour
    
    # Worker settings
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    
    # Task execution settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    
    # Rate limiting
    task_default_rate_limit="10/m",
    
    # Retry settings
    task_autoretry_for=(Exception,),
    task_retry_kwargs={"max_retries": 3, "countdown": 60},
)

# Task routes
celery_app.conf.task_routes = {
    "app.tasks.analysis_tasks.*": {"queue": "analysis"},
}
