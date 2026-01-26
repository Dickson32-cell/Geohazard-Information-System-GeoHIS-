
import os
import sys
import numpy as np
import rasterio
from rasterio.transform import from_bounds
from pathlib import Path

# Add backend to path to import app modules
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.spatial_extraction import SpatialExtractor
from app.analysis.statistical_models.logistic_regression import SusceptibilityLogisticRegression

def create_synthetic_raster(path, width, height, bounds, data_type='float', is_hazard=False):
    """
    Create a synthetic GeoTIFF.
    """
    transform = from_bounds(
        bounds['min_lon'], bounds['min_lat'], 
        bounds['max_lon'], bounds['max_lat'], 
        width, height
    )
    
    if is_hazard:
        # Binary 0/1 data
        data = np.random.choice([0, 1], size=(height, width), p=[0.7, 0.3]).astype(rasterio.uint8)
        dtype = rasterio.uint8
        nodata = 255
    else:
        # Continuous float data (e.g., slope, elevation)
        data = np.random.uniform(0, 100, size=(height, width)).astype(rasterio.float32)
        dtype = rasterio.float32
        nodata = -9999

    with rasterio.open(
        path, 'w',
        driver='GTiff',
        height=height,
        width=width,
        count=1,
        dtype=dtype,
        crs='EPSG:4326',
        transform=transform,
        nodata=nodata
    ) as dst:
        dst.write(data, 1)
        
    print(f"Created {path} ({width}x{height})")
    return path

def test_phd_features():
    print("=== Testing PhD-Level Features ===")
    
    # Setup paths
    test_dir = Path("backend/data/test_phd")
    test_dir.mkdir(parents=True, exist_ok=True)
    
    hazard_path = test_dir / "hazard.tif"
    slope_path = test_dir / "slope_mismatched.tif"
    elev_path = test_dir / "elevation_mismatched.tif"
    
    bounds = {
        'min_lon': -0.30, 'max_lon': -0.18,
        'min_lat': 6.02, 'max_lat': 6.12
    }
    
    # 1. Create Data with MISMATCHED dimensions
    # Hazard: 100x100 (Reference)
    create_synthetic_raster(hazard_path, 100, 100, bounds, is_hazard=True)
    
    # Factors: 50x50 (Different resolution, requiring resampling)
    create_synthetic_raster(slope_path, 50, 50, bounds)
    create_synthetic_raster(elev_path, 60, 60, bounds) # Even weirder dimension
    
    # 2. Test Spatial Extractor
    print("\n--- Testing Spatial Extraction (Resampling) ---")
    extractor = SpatialExtractor()
    
    try:
        data = extractor.extract_data(
            factor_paths={
                'slope': str(slope_path),
                'elevation': str(elev_path)
            },
            hazard_path=str(hazard_path)
        )
        print("Extraction Successful!")
        print(f"X shape: {np.array(data['X']).shape}")
        print(f"y shape: {len(data['y'])}")
        print(f"Coords shape: {len(data['coordinates'])}")
        
        if np.array(data['X']).shape[0] == len(data['y']):
             print("Check: Sample counts match.")
        else:
             print("FAIL: Sample counts mismatch.")
             
    except Exception as e:
        print(f"Extraction Failed: {e}")
        return

    # 3. Test Logistic Regression with Spatial CV & Uncertainty
    print("\n--- Testing Model Training with Uncertainty ---")
    
    X = np.array(data['X'])
    y = np.array(data['y'])
    coords = np.array(data['coordinates'])
    feature_names = data['feature_names']
    
    model = SusceptibilityLogisticRegression(feature_names=feature_names)
    
    # Train with coordinates to trigger Spatial CV
    results = model.train(X, y, coordinates=coords)
    
    print(f"Training completed.")
    print(f"Validation Method: {results.get('validation_method')}")
    print(f"Uncertainty Capable: {results.get('uncertainty_capable')}")
    
    if results.get('uncertainty_capable'):
        print("\n--- Testing Uncertainty Prediction ---")
        # Predict on first 5 samples
        sample_X = X[:5]
        mean_pred, std_pred = model.predict_uncertainty(sample_X)
        
        print("Predictions for first 5 samples:")
        for i in range(5):
            print(f"Sample {i}: Probability={mean_pred[i]:.4f} ± {std_pred[i]:.4f} (std)")
            
        if np.any(std_pred > 0):
            print("Check: Uncertainty (std dev) is non-zero, proving ensemble variation.")
        else:
            print("Warning: Uncertainty is zero (models might be identical).")
            
    print("\n=== Test Complete ===")

if __name__ == "__main__":
    test_phd_features()
