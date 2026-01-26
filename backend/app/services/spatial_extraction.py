"""
Spatial Extraction Service for GeoHIS

Responsible for converting raw geospatial raster data into structured
tabular data (X, y, coordinates) suitable for statistical analysis.

Features:
- Raster alignment and intersection
- Handling of NoData values
- Flattening of 2D arrays to 1D feature vectors
- Extraction of coordinates for spatial validation
"""

import rasterio
import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional, Union, Any
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class SpatialExtractor:
    """
    Extracts aligned data from multiple raster files.
    """
    
    def __init__(self):
        self.nodata_value = -9999
        
    def extract_data(
        self, 
        factor_paths: Dict[str, str], 
        hazard_path: str,
        output_format: str = 'dict'
    ) -> Union[Dict[str, Any], pd.DataFrame]:
        """
        Extract data from factor rasters and hazard raster.
        
        Args:
            factor_paths: Dictionary mapping factor names to file paths
            hazard_path: Path to the binary hazard raster (0/1)
            output_format: 'dict' (for API) or 'dataframe'
            
        Returns:
            Dictionary containing X (features), y (labels), coords, and feature_names
        """
        try:
            # 1. Open hazard raster to establish reference grid
            with rasterio.open(hazard_path) as src_hazard:
                hazard_data = src_hazard.read(1)
                hazard_profile = src_hazard.profile
                hazard_transform = src_hazard.transform
                hazard_nodata = src_hazard.nodata
                
            # 2. Initialize masks and containers
            # Create a mask of valid pixels (not NoData in hazard raster)
            if hazard_nodata is not None:
                valid_mask = (hazard_data != hazard_nodata)
            else:
                valid_mask = np.ones_like(hazard_data, dtype=bool)
                
            features_dict = {}
            
            # 3. Process each factor raster
            for name, path in factor_paths.items():
                with rasterio.open(path) as src:
                    # Check if alignment matches hazard raster
                    if src.shape != hazard_data.shape:
                        logger.info(f"Resampling {name} to match hazard raster...")
                        from rasterio.warp import reproject, Resampling
                        
                        data = np.empty(hazard_data.shape, dtype=src.dtypes[0])
                        reproject(
                            source=rasterio.band(src, 1),
                            destination=data,
                            src_transform=src.transform,
                            src_crs=src.crs,
                            dst_transform=hazard_transform,
                            dst_crs=hazard_profile['crs'],
                            resampling=Resampling.nearest
                        )
                    else:
                        data = src.read(1)

                    features_dict[name] = data
                    
                    # Update valid mask with this factor's NoData
                    if src.nodata is not None:
                        valid_mask &= (data != src.nodata)
                        
            # 4. Extract flattened arrays using the valid mask
            # Get coordinates for valid pixels
            rows, cols = np.where(valid_mask)
            xs, ys = rasterio.transform.xy(hazard_transform, rows, cols)
            
            # Extract Y (Hazard labels)
            y = hazard_data[valid_mask]
            
            # Ensure y is binary (0/1) if it's not already
            # Assuming hazard raster might have other values, we strictly need 0 and 1
            # If y contains other values, we might need thresholding, but let's assume valid input for now
            
            # Extract X (Features)
            X_data = []
            feature_names = list(factor_paths.keys())
            
            for name in feature_names:
                X_data.append(features_dict[name][valid_mask])
            
            X = np.column_stack(X_data)
            coords = np.column_stack([xs, ys])
            
            logger.info(f"Extracted {len(y)} valid pixels from {len(factor_paths)} factors.")
            
            if output_format == 'dataframe':
                df = pd.DataFrame(X, columns=feature_names)
                df['target'] = y
                df['x'] = xs
                df['y'] = ys
                return df
            
            return {
                "X": X.tolist(),
                "y": y.tolist(),
                "coordinates": coords.tolist(),
                "feature_names": feature_names,
                "n_samples": len(y)
            }
            
        except Exception as e:
            logger.error(f"Error in spatial extraction: {str(e)}")
            raise

