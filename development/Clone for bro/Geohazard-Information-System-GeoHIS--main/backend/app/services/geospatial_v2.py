"""
Geospatial Service v2 for GeoHIS

Advanced geospatial analysis service that works with or without raster data.
Provides intelligent fallbacks and data quality assessment.

Features:
- Real raster-based calculations when data is available
- Clear messaging when data is missing
- Data quality assessment and validation
- Production-ready error handling

Author: GeoHIS Team
Version: 2.0.0
"""

import rasterio
from rasterio.transform import rowcol
from pyproj import Transformer
import numpy as np
from typing import Optional, Dict, Any, List
from pathlib import Path
import logging
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class DataLayer:
    """Represents a geospatial data layer"""
    name: str
    file_path: Optional[str]
    layer_type: str
    required_for_flood: bool = False
    required_for_landslide: bool = False
    description: str = ""
    last_updated: Optional[datetime] = None


@dataclass
class SusceptibilityResult:
    """Result of susceptibility calculation"""
    susceptibility_index: Optional[float]
    classification: str
    has_real_data: bool
    data_quality: Dict[str, Any]
    factors_used: List[str]
    confidence_level: str


class DataManager:
    """Manages geospatial data layers and their availability"""

    def __init__(self):
        self.layers = self._initialize_layers()

    def _initialize_layers(self) -> Dict[str, DataLayer]:
        """Initialize default data layer definitions"""
        return {
            'elevation': DataLayer(
                name='Digital Elevation Model',
                file_path=None,
                layer_type='dem',
                required_for_flood=True,
                required_for_landslide=False,
                description='DEM for elevation analysis'
            ),
            'slope': DataLayer(
                name='Slope Analysis',
                file_path=None,
                layer_type='slope',
                required_for_flood=True,
                required_for_landslide=True,
                description='Slope gradient in degrees'
            ),
            'drainage': DataLayer(
                name='Drainage Proximity',
                file_path=None,
                layer_type='drainage',
                required_for_flood=True,
                required_for_landslide=False,
                description='Distance to drainage networks'
            ),
            'soil': DataLayer(
                name='Soil Type',
                file_path=None,
                layer_type='soil',
                required_for_flood=True,
                required_for_landslide=False,
                description='Soil permeability and type'
            ),
            'landuse': DataLayer(
                name='Land Use/Land Cover',
                file_path=None,
                layer_type='landuse',
                required_for_flood=True,
                required_for_landslide=False,
                description='Land use classification'
            ),
            'geology': DataLayer(
                name='Geological Formation',
                file_path=None,
                layer_type='geology',
                required_for_flood=False,
                required_for_landslide=True,
                description='Geological formations and lithology'
            ),
            'landcover': DataLayer(
                name='Land Cover',
                file_path=None,
                layer_type='landcover',
                required_for_flood=False,
                required_for_landslide=True,
                description='Detailed land cover classification'
            )
        }

    def update_layer_path(self, layer_name: str, file_path: str):
        """Update the file path for a data layer"""
        if layer_name in self.layers:
            self.layers[layer_name].file_path = file_path
            self.layers[layer_name].last_updated = datetime.now()
            logger.info(f"Updated {layer_name} path to {file_path}")

    def get_available_layers(self) -> Dict[str, bool]:
        """Get availability status of all layers"""
        return {name: layer.file_path is not None for name, layer in self.layers.items()}

    def get_data_status(self) -> Dict[str, Any]:
        """Get comprehensive data status report"""
        available = self.get_available_layers()

        # Calculate what's missing for each hazard type
        flood_layers = [name for name, layer in self.layers.items() if layer.required_for_flood]
        landslide_layers = [name for name, layer in self.layers.items() if layer.required_for_landslide]

        missing_for_flood = [layer for layer in flood_layers if not available[layer]]
        missing_for_landslide = [layer for layer in landslide_layers if not available[layer]]

        return {
            'summary': {
                'available': sum(available.values()),
                'total': len(available),
                'missing_for_flood': missing_for_flood,
                'missing_for_landslide': missing_for_landslide,
                'flood_ready': len(missing_for_flood) == 0,
                'landslide_ready': len(missing_for_landslide) == 0,
                'fully_ready': len(missing_for_flood) == 0 and len(missing_for_landslide) == 0
            },
            'layers': {
                name: {
                    'available': available[name],
                    'file_path': layer.file_path,
                    'description': layer.description,
                    'last_updated': layer.last_updated.isoformat() if layer.last_updated else None
                }
                for name, layer in self.layers.items()
            }
        }


class GeospatialServiceV2:
    """Advanced geospatial analysis service"""

    def __init__(self, data_manager: DataManager):
        self.data_manager = data_manager
        self._transformer_cache = {}

    def get_raster_value(self, raster_path: str, lat: float, lon: float) -> Optional[float]:
        """
        Get raster value at a specific coordinate with error handling.

        Returns None if:
        - File doesn't exist
        - Coordinate is outside bounds
        - NoData value encountered
        """
        try:
            if not Path(raster_path).exists():
                logger.warning(f"Raster file not found: {raster_path}")
                return None

            with rasterio.open(raster_path) as src:
                # Use cached transformer if available
                cache_key = f"{src.crs}_{src.transform}"
                if cache_key not in self._transformer_cache:
                    self._transformer_cache[cache_key] = Transformer.from_crs(
                        "EPSG:4326", src.crs, always_xy=True
                    )

                transformer = self._transformer_cache[cache_key]
                x, y = transformer.transform(lon, lat)

                # Get row/col
                row, col = src.index(x, y)

                # Check bounds
                if not (0 <= row < src.height and 0 <= col < src.width):
                    return None

                # Read value
                value = src.read(1)[row, col]

                # Check for NoData
                if src.nodata is not None and value == src.nodata:
                    return None

                return float(value)

        except Exception as e:
            logger.error(f"Error reading raster {raster_path} at ({lat}, {lon}): {e}")
            return None

    def calculate_flood_susceptibility(self, lat: float, lon: float) -> Dict[str, Any]:
        """
        Calculate flood susceptibility with intelligent data handling.

        Returns detailed result including data quality assessment.
        """
        layers = self.data_manager.layers
        factors_used = []
        factor_values = {}

        # Get available data
        data_available = {
            'elevation': layers['elevation'].file_path,
            'slope': layers['slope'].file_path,
            'drainage': layers['drainage'].file_path,
            'soil': layers['soil'].file_path,
            'landuse': layers['landuse'].file_path
        }

        # Extract factor values
        for factor, path in data_available.items():
            if path:
                value = self.get_raster_value(path, lat, lon)
                if value is not None:
                    factor_values[factor] = value
                    factors_used.append(factor)

        # Calculate susceptibility if we have data
        if factor_values:
            susceptibility = self._compute_flood_susceptibility(factor_values)
            classification = self._classify_susceptibility(susceptibility)
            confidence = self._assess_confidence(factors_used, 'flood')

            return {
                'susceptibility_index': round(susceptibility, 2),
                'classification': classification,
                'has_real_data': True,
                'data_quality': {
                    'factors_used': factors_used,
                    'confidence_level': confidence,
                    'data_completeness': len(factors_used) / 5  # 5 factors total
                }
            }
        else:
            # No data available
            return {
                'susceptibility_index': None,
                'classification': 'Data Required',
                'has_real_data': False,
                'data_quality': {
                    'factors_used': [],
                    'confidence_level': 'none',
                    'data_completeness': 0.0,
                    'missing_layers': list(data_available.keys())
                }
            }

    def calculate_landslide_susceptibility(self, lat: float, lon: float) -> Dict[str, Any]:
        """
        Calculate landslide susceptibility with intelligent data handling.
        """
        layers = self.data_manager.layers
        factors_used = []
        factor_values = {}

        # Get available data
        data_available = {
            'slope': layers['slope'].file_path,
            'geology': layers['geology'].file_path,
            'landcover': layers['landcover'].file_path
        }

        # Extract factor values
        for factor, path in data_available.items():
            if path:
                value = self.get_raster_value(path, lat, lon)
                if value is not None:
                    factor_values[factor] = value
                    factors_used.append(factor)

        # Calculate susceptibility if we have data
        if factor_values:
            susceptibility = self._compute_landslide_susceptibility(factor_values)
            classification = self._classify_susceptibility(susceptibility)
            confidence = self._assess_confidence(factors_used, 'landslide')

            return {
                'susceptibility_index': round(susceptibility, 2),
                'classification': classification,
                'has_real_data': True,
                'data_quality': {
                    'factors_used': factors_used,
                    'confidence_level': confidence,
                    'data_completeness': len(factors_used) / 3  # 3 factors total
                }
            }
        else:
            # No data available
            return {
                'susceptibility_index': None,
                'classification': 'Data Required',
                'has_real_data': False,
                'data_quality': {
                    'factors_used': [],
                    'confidence_level': 'none',
                    'data_completeness': 0.0,
                    'missing_layers': list(data_available.keys())
                }
            }

    def _compute_flood_susceptibility(self, factors: Dict[str, float]) -> float:
        """Compute flood susceptibility using AHP weights"""
        weights = {
            'elevation': 0.298,
            'drainage': 0.298,
            'slope': 0.158,
            'soil': 0.158,
            'landuse': 0.089
        }

        susceptibility = 0
        total_weight = 0

        for factor, weight in weights.items():
            if factor in factors:
                # Normalize factor values (simplified normalization)
                if factor == 'elevation':
                    # Lower elevation = higher risk
                    normalized = max(0, min(100, (200 - factors[factor]) / 2))
                elif factor == 'slope':
                    # Flatter slope = higher risk
                    normalized = max(0, min(100, 100 - factors[factor] * 2))
                elif factor == 'drainage':
                    # Closer to drainage = higher risk
                    normalized = max(0, min(100, 100 - factors[factor] / 10))
                else:
                    # Generic normalization for other factors
                    normalized = max(0, min(100, factors[factor] * 10))

                susceptibility += normalized * weight
                total_weight += weight

        # Normalize result
        if total_weight > 0:
            susceptibility = susceptibility / total_weight * 100

        return max(0, min(100, susceptibility))

    def _compute_landslide_susceptibility(self, factors: Dict[str, float]) -> float:
        """Compute landslide susceptibility using frequency ratio approach"""
        weights = {
            'slope': 0.5,
            'geology': 0.3,
            'landcover': 0.2
        }

        susceptibility = 0
        total_weight = 0

        for factor, weight in weights.items():
            if factor in factors:
                # Factor-specific normalization
                if factor == 'slope':
                    # Optimal slope range for landslides: 30-45 degrees
                    slope = factors[factor]
                    if 30 <= slope <= 45:
                        normalized = 100
                    elif slope > 45:
                        normalized = 80
                    else:
                        normalized = slope / 30 * 60
                else:
                    # Generic normalization for geology and landcover
                    normalized = max(0, min(100, factors[factor] * 25))

                susceptibility += normalized * weight
                total_weight += weight

        if total_weight > 0:
            susceptibility = susceptibility / total_weight

        return max(0, min(100, susceptibility))

    def _classify_susceptibility(self, value: float) -> str:
        """Classify susceptibility value"""
        if value < 20:
            return "Very Low"
        elif value < 40:
            return "Low"
        elif value < 60:
            return "Moderate"
        elif value < 80:
            return "High"
        else:
            return "Very High"

    def _assess_confidence(self, factors_used: List[str], hazard_type: str) -> str:
        """Assess confidence level based on available data"""
        if hazard_type == 'flood':
            required = ['elevation', 'drainage', 'slope']
            if all(f in factors_used for f in required):
                return 'high'
            elif len(factors_used) >= 2:
                return 'medium'
            elif len(factors_used) >= 1:
                return 'low'
        else:  # landslide
            required = ['slope']
            if all(f in factors_used for f in required):
                return 'high'
            elif len(factors_used) >= 1:
                return 'medium'

        return 'low'

    def get_data_status(self) -> Dict[str, Any]:
        """Get current data status"""
        return self.data_manager.get_data_status()


# Global instances
_data_manager = DataManager()
_geospatial_service = GeospatialServiceV2(_data_manager)


def get_geospatial_service() -> GeospatialServiceV2:
    """Get the global geospatial service instance"""
    return _geospatial_service


def get_data_manager() -> DataManager:
    """Get the global data manager instance"""
    return _data_manager