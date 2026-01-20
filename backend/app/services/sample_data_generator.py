"""
Sample Data Generator for GeoHIS

Generates synthetic GeoTIFF raster files for testing and demonstration.
These rasters simulate real geospatial data patterns for the study area.

Author: GeoHIS Team
Version: 1.0.0
"""

import numpy as np
from pathlib import Path
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

# Try to import rasterio
try:
    import rasterio
    from rasterio.transform import from_bounds
    from rasterio.crs import CRS
    RASTERIO_AVAILABLE = True
except ImportError:
    RASTERIO_AVAILABLE = False
    logger.warning("Rasterio not available - sample data generation limited")

# Default study area bounds (New Juaben South Municipality, Ghana)
DEFAULT_BOUNDS = {
    'min_lon': -0.30,
    'max_lon': -0.18,
    'min_lat': 6.02,
    'max_lat': 6.12
}

# Default raster dimensions
DEFAULT_SIZE = (100, 100)  # rows, cols


def generate_elevation_raster(
    output_path: Path,
    bounds: Dict[str, float] = None,
    size: tuple = DEFAULT_SIZE
) -> str:
    """
    Generate a synthetic elevation (DEM) raster.
    
    Simulates terrain with valleys, hills, and drainage patterns.
    """
    bounds = bounds or DEFAULT_BOUNDS
    rows, cols = size
    
    # Create coordinate grids
    x = np.linspace(0, 1, cols)
    y = np.linspace(0, 1, rows)
    xx, yy = np.meshgrid(x, y)
    
    # Generate terrain with multiple components
    # Base elevation (150-350m typical for Eastern Ghana)
    base = 200
    
    # Hills and ridges
    hills = 80 * np.sin(xx * 3 * np.pi) * np.cos(yy * 2 * np.pi)
    
    # Valley system (drainage)
    valley = -40 * np.exp(-((xx - 0.5)**2 + (yy - 0.3)**2) / 0.1)
    
    # Random variation
    np.random.seed(42)
    noise = np.random.normal(0, 10, (rows, cols))
    
    elevation = base + hills + valley + noise
    elevation = np.clip(elevation, 100, 400).astype(np.float32)
    
    return _write_raster(output_path, elevation, bounds, "elevation")


def generate_slope_raster(
    output_path: Path,
    bounds: Dict[str, float] = None,
    size: tuple = DEFAULT_SIZE
) -> str:
    """
    Generate a synthetic slope raster.
    
    Slope values in degrees (0-90).
    """
    bounds = bounds or DEFAULT_BOUNDS
    rows, cols = size
    
    x = np.linspace(0, 1, cols)
    y = np.linspace(0, 1, rows)
    xx, yy = np.meshgrid(x, y)
    
    # Steeper slopes on edges and ridges
    slope = 5 + 15 * (np.abs(np.sin(xx * 4 * np.pi)) + np.abs(np.cos(yy * 3 * np.pi)))
    
    # Add random variation
    np.random.seed(43)
    noise = np.random.normal(0, 3, (rows, cols))
    
    slope = slope + noise
    slope = np.clip(slope, 0, 45).astype(np.float32)
    
    return _write_raster(output_path, slope, bounds, "slope")


def generate_drainage_raster(
    output_path: Path,
    bounds: Dict[str, float] = None,
    size: tuple = DEFAULT_SIZE
) -> str:
    """
    Generate a synthetic drainage proximity raster.
    
    Values represent distance to nearest stream/river in meters.
    """
    bounds = bounds or DEFAULT_BOUNDS
    rows, cols = size
    
    x = np.linspace(0, 1, cols)
    y = np.linspace(0, 1, rows)
    xx, yy = np.meshgrid(x, y)
    
    # Create drainage network pattern
    # Main river through center
    main_river = np.abs(yy - 0.5)
    
    # Tributaries
    trib1 = np.abs(xx - 0.3)
    trib2 = np.abs(xx - 0.7)
    
    # Distance to nearest drainage
    drainage_dist = np.minimum(main_river, np.minimum(trib1, trib2))
    drainage_dist = drainage_dist * 2000  # Scale to meters (0-2000m)
    
    # Add noise
    np.random.seed(44)
    noise = np.random.normal(0, 50, (rows, cols))
    
    drainage = drainage_dist + noise
    drainage = np.clip(drainage, 0, 2500).astype(np.float32)
    
    return _write_raster(output_path, drainage, bounds, "drainage")
