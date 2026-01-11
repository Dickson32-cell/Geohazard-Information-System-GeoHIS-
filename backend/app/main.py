"""
GeoHIS Main Application

Production-ready FastAPI application with authentication, rate limiting,
security headers, and comprehensive API endpoints.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from decouple import config
import logging

# Import routers
from app.routes.hazard_events import router as hazard_events_router
from app.routes.hazard_zones import router as hazard_zones_router
from app.routes.infrastructure_assets import router as infrastructure_assets_router
from app.routes.spatial_layers import router as spatial_layers_router
from app.routes.analysis import router as analysis_router
from app.routes.upload import router as upload_router
from app.routes.study_area import router as study_area_router

from app.routes.jobs import router as jobs_router
from app.routes.export import router as export_router
from app.auth.routes import router as auth_router

# Import middleware
from app.middleware.security import SecurityHeadersMiddleware
from app.middleware.rate_limit import setup_rate_limiting

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    
    Handles startup and shutdown events.
    """
    # Startup
    logger.info("Starting GeoHIS API...")
    logger.info(f"Environment: {config('ENVIRONMENT', default='development')}")
    
    # Validate production configuration
    environment = config("ENVIRONMENT", default="development")
    if environment == "production":
        secret_key = config("SECRET_KEY", default="")
        if "change-this" in secret_key.lower() or len(secret_key) < 32:
            logger.warning("⚠️  SECRET_KEY should be changed in production!")
    
    yield
    
    # Shutdown
    logger.info("Shutting down GeoHIS API...")


# Create FastAPI application
app = FastAPI(
    title="GeoHIS API",
    description="""
    ## Geohazard Information System API
    
    A production-ready API for flood and landslide susceptibility analysis
    in New Juaben South Municipality, Ghana.
    
    ### Features
    - 🔐 **Authentication**: JWT-based user authentication
    - 📊 **Analysis**: AHP-based flood and FR-based landslide susceptibility
    - 📍 **Location Analysis**: Analyze custom coordinates
    - 🗺️ **Hazard Data**: Access historical hazard events and zones
    - 🏢 **Infrastructure**: Risk assessment for critical infrastructure
    
    ### Authentication
    Most endpoints require authentication. Use the `/auth/login` endpoint
    to obtain an access token, then include it in the Authorization header:
    ```
    Authorization: Bearer <access_token>
    ```
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Get CORS origins from environment
CORS_ORIGINS = config("CORS_ORIGINS", default="http://localhost:3001,http://localhost:8081").split(",")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware, csp_enabled=True)

# Setup rate limiting
setup_rate_limiting(app)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions with a clean error response."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    # Don't expose internal errors in production
    environment = config("ENVIRONMENT", default="development")
    if environment == "production":
        detail = "An internal error occurred"
    else:
        detail = str(exc)
    
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "An internal error occurred",
            "detail": detail
        }
    )


# ============== Include Routers ==============

# Authentication routes (public)
app.include_router(auth_router, prefix="/api/v1", tags=["authentication"])

# Data routes
app.include_router(hazard_events_router, prefix="/api/v1", tags=["hazard-events"])
app.include_router(hazard_zones_router, prefix="/api/v1", tags=["hazard-zones"])
app.include_router(infrastructure_assets_router, prefix="/api/v1", tags=["infrastructure-assets"])
app.include_router(spatial_layers_router, prefix="/api/v1", tags=["spatial-layers"])

# Analysis routes
app.include_router(analysis_router, tags=["analysis"])
app.include_router(upload_router, prefix="/api/v1", tags=["upload"])

# Study area configuration (for researchers to define their own regions)
app.include_router(study_area_router, tags=["study-area"])

# Research export routes (CSV, figures, tables)
app.include_router(export_router, prefix="/api/v1", tags=["research-export"])



# Background job routes
app.include_router(jobs_router, prefix="/api/v1", tags=["jobs"])


# ============== Root Endpoints ==============

@app.get("/", tags=["system"])
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Welcome to GeoHIS API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
        "study_area": "New Juaben South Municipality, Ghana"
    }


@app.get("/health", tags=["system"])
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "service": "geohis-api",
        "version": "1.0.0"
    }


@app.get("/api/v1/info", tags=["system"])
async def api_info():
    """Get API information and available features."""
    return {
        "api_version": "1.0.0",
        "study_area": {
            "name": "New Juaben South Municipality",
            "region": "Eastern Region",
            "country": "Ghana",
            "area_km2": 110
        },
        "methods": {
            "flood": "Analytical Hierarchy Process (AHP)",
            "landslide": "Frequency Ratio (FR)"
        },
        "validation": {
            "auc_roc": 0.927,
            "accuracy": 0.813,
            "classification": "Excellent"
        },
        "features": [
            "JWT Authentication",
            "Rate Limiting",
            "Coordinate Analysis",
            "GeoJSON Upload",
            "Historical Hazard Data",
            "Infrastructure Risk Assessment"
        ],
        "limits": {
            "max_coordinates_per_request": 10000,
            "max_upload_size_mb": 50,
            "rate_limit_per_minute": 100
        }
    }
