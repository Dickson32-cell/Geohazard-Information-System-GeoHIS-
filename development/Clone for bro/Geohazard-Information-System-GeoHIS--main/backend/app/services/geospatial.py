"""
Geospatial Service for GeoHIS

Provides functionality to query spatial data layers (rasters) for susceptibility analysis.
Uses rasterio for efficient geospatial data access.
"""

import rasterio
from rasterio.transform import rowcol
from rasterio.warp import transform_bounds
from pyproj import Transformer
import numpy as np
from typing import Optional, Dict, Any
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class GeospatialService:
    """Service for querying geospatial raster data"""

    @staticmethod
    def get_raster_value(raster_path: str, lat: float, lon: float) -> Optional[float]:
        """
        Get raster value at a specific latitude/longitude coordinate.

        Args:
            raster_path: Path to the raster file
            lat: Latitude in decimal degrees
            lon: Longitude in decimal degrees

        Returns:
            Raster value at the coordinate, or None if outside bounds or error
        """
        try:
            with rasterio.open(raster_path) as src:
                # Transform lat/lon to raster coordinates
                transformer = Transformer.from_crs("EPSG:4326", src.crs, always_xy=True)
                x, y = transformer.transform(lon, lat)

                # Get row/col for the coordinate
                row, col = src.index(x, y)

                # Check if within bounds
                if 0 <= row < src.height and 0 <= col < src.width:
                    # Read the value
                    value = src.read(1)[row, col]
                    # Check for NoData
                    if src.nodata is not None and value == src.nodata:
                        return None
                    return float(value)
                else:
                    logger.warning(f"Coordinate ({lat}, {lon}) is outside raster bounds")
                    return None

        except Exception as e:
            logger.error(f"Error reading raster {raster_path} at ({lat}, {lon}): {e}")
            return None

    @staticmethod
    def calculate_flood_susceptibility_real(
        lat: float, lon: float,
        elevation_raster: Optional[str] = None,
        slope_raster: Optional[str] = None,
        drainage_raster: Optional[str] = None,
        soil_raster: Optional[str] = None,
        landuse_raster: Optional[str] = None
    ) -> float:
        """
        Calculate flood susceptibility using real geospatial data.

        Based on AHP weights:
        - Elevation: 0.298
        - Drainage Proximity: 0.298
        - Slope: 0.158
        - Soil: 0.158
        - Land Use: 0.089

        Args:
            lat, lon: Coordinates
            *_raster: Paths to respective raster files

        Returns:
            Susceptibility score (0-100)
        """
        factors = {}

        # Get elevation (lower elevation = higher flood risk)
        if elevation_raster:
            elev = GeospatialService.get_raster_value(elevation_raster, lat, lon)
            if elev is not None:
                # Normalize elevation (assuming 0-200m range, lower = higher risk)
                factors['elevation'] = max(0, min(100, (200 - elev) / 2))

        # Get slope (steeper slope = lower flood risk)
        if slope_raster:
            slope = GeospatialService.get_raster_value(slope_raster, lat, lon)
            if slope is not None:
                # Slope in degrees, higher slope = lower flood risk
                factors['slope'] = max(0, min(100, 100 - slope * 2))

        # Get drainage proximity (closer to drainage = higher risk)
        if drainage_raster:
            drain_dist = GeospatialService.get_raster_value(drainage_raster, lat, lon)
            if drain_dist is not None:
                # Distance in meters, closer = higher risk
                factors['drainage'] = max(0, min(100, 100 - drain_dist / 10))

        # Get soil type (some soils have higher permeability)
        if soil_raster:
            soil = GeospatialService.get_raster_value(soil_raster, lat, lon)
            if soil is not None:
                # Soil type codes, assume higher values = less permeable
                factors['soil'] = max(0, min(100, soil * 20))

        # Get land use (urban areas may have higher runoff)
        if landuse_raster:
            landuse = GeospatialService.get_raster_value(landuse_raster, lat, lon)
            if landuse is not None:
                # Land use codes, assume urban (high values) = higher risk
                factors['landuse'] = max(0, min(100, landuse * 10))

        # If no data available, return default
        if not factors:
            return 50.0

        # AHP weights
        weights = {
            'elevation': 0.298,
            'drainage': 0.298,
            'slope': 0.158,
            'soil': 0.158,
            'landuse': 0.089
        }

        # Calculate weighted sum
        susceptibility = 0
        total_weight = 0
        for factor, weight in weights.items():
            if factor in factors:
                susceptibility += factors[factor] * weight
                total_weight += weight

        # Normalize if not all factors available
        if total_weight > 0:
            susceptibility = susceptibility / total_weight * 100

        return max(0, min(100, susceptibility))

    @staticmethod
    def calculate_landslide_susceptibility_real(
        lat: float, lon: float,
        slope_raster: Optional[str] = None,
        geology_raster: Optional[str] = None,
        landcover_raster: Optional[str] = None
    ) -> float:
        """
        Calculate landslide susceptibility using real geospatial data.

        Based on Frequency Ratio method with key factors.

        Args:
            lat, lon: Coordinates
            *_raster: Paths to respective raster files

        Returns:
            Susceptibility score (0-100)
        """
        factors = {}

        # Get slope (primary factor for landslides)
        if slope_raster:
            slope = GeospatialService.get_raster_value(slope_raster, lat, lon)
            if slope is not None:
                # Slope in degrees, optimal range 30-45° for landslides
                if 30 <= slope <= 45:
                    factors['slope'] = 100
                elif slope > 45:
                    factors['slope'] = 80
                else:
                    factors['slope'] = slope / 30 * 60

        # Get geology
        if geology_raster:
            geology = GeospatialService.get_raster_value(geology_raster, lat, lon)
            if geology is not None:
                # Geology codes, certain formations more susceptible
                # Assume higher values indicate more susceptible geology
                factors['geology'] = max(0, min(100, geology * 25))

        # Get land cover
        if landcover_raster:
            landcover = GeospatialService.get_raster_value(landcover_raster, lat, lon)
            if landcover is not None:
                # Land cover codes, bare land = higher risk
                factors['landcover'] = max(0, min(100, landcover * 20))

        # If no data available, return default
        if not factors:
            return 30.0

        # Simple weighted average for demonstration
        # In production, use proper FR or AHP methodology
        weights = {
            'slope': 0.5,
            'geology': 0.3,
            'landcover': 0.2
        }

        susceptibility = 0
        total_weight = 0
        for factor, weight in weights.items():
            if factor in factors:
                susceptibility += factors[factor] * weight
                total_weight += weight

        if total_weight > 0:
            susceptibility = susceptibility / total_weight

        return max(0, min(100, susceptibility))