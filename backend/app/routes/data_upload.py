"""
Data Upload Routes for GeoHIS
Provides endpoints for uploading geospatial raster data.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from pathlib import Path
import os
from datetime import datetime
import logging

try:
    import rasterio
    RASTERIO_AVAILABLE = True
except ImportError:
    RASTERIO_AVAILABLE = False

from app.services.geospatial_v2 import get_data_manager, get_geospatial_service

logger = logging.getLogger(__name__)
router = APIRouter()

DATA_DIR = Path(__file__).parent.parent.parent / "data" / "rasters"
ALLOWED_EXTENSIONS = {'.tif', '.tiff', '.geotiff', '.img', '.asc'}
MAX_FILE_SIZE = 500 * 1024 * 1024

DATA_DIR.mkdir(parents=True, exist_ok=True)

LAYER_TYPES = {
    'elevation': {'name': 'Digital Elevation Model (DEM)', 'description': 'Elevation in meters', 'required_for': ['flood']},
    'slope': {'name': 'Slope Analysis', 'description': 'Slope gradient in degrees', 'required_for': ['flood', 'landslide']},
    'drainage': {'name': 'Drainage Proximity', 'description': 'Distance to drainage in meters', 'required_for': ['flood']},
    'soil': {'name': 'Soil Type', 'description': 'Soil classification', 'required_for': ['flood']},
    'landuse': {'name': 'Land Use', 'description': 'Land use classification', 'required_for': ['flood']},
    'geology': {'name': 'Geology', 'description': 'Geological formation', 'required_for': ['landslide']},
    'landcover': {'name': 'Land Cover', 'description': 'Land cover classification', 'required_for': ['landslide']},
}

class LayerInfo(BaseModel):
    layer_type: str
    name: str
    description: str
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    is_available: bool = False

def get_storage_used():
    total = 0
    if DATA_DIR.exists():
        for f in DATA_DIR.rglob('*'):
            if f.is_file():
                total += f.stat().st_size
    return total / (1024 * 1024)

@router.get("/data/status")
async def get_data_status():
    data_manager = get_data_manager()
    layers = {}
    for lt, info in LAYER_TYPES.items():
        layer_data = data_manager.layers.get(lt)
        avail = layer_data.file_path is not None if layer_data else False
        layers[lt] = {"layer_type": lt, "name": info['name'], "description": info['description'], "is_available": avail}
    
    flood_ready = all(layers.get(l, {}).get('is_available', False) for l in ['elevation', 'slope', 'drainage'])
    landslide_ready = all(layers.get(l, {}).get('is_available', False) for l in ['slope', 'geology'])
    available_count = sum(1 for l in layers.values() if l.get('is_available', False))
    
    return {"total_layers": len(LAYER_TYPES), "available_layers": available_count, "flood_ready": flood_ready,
            "landslide_ready": landslide_ready, "layers": layers, "storage_used_mb": round(get_storage_used(), 2)}

@router.get("/data/layers")
async def list_layer_types():
    return {"layer_types": LAYER_TYPES, "flood_required": ["elevation", "slope", "drainage"],
            "landslide_required": ["slope", "geology"], "supported_formats": list(ALLOWED_EXTENSIONS)}

@router.post("/data/upload/{layer_type}")
async def upload_raster_data(layer_type: str, file: UploadFile = File(...)):
    if layer_type not in LAYER_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid layer type: {layer_type}")
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename required")
    
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Invalid format. Supported: {list(ALLOWED_EXTENSIONS)}")
    
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large")
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{layer_type}_{timestamp}{ext}"
    filepath = DATA_DIR / filename
    
    with open(filepath, 'wb') as f:
        f.write(content)
    
    get_data_manager().update_layer_path(layer_type, str(filepath))
    return {"success": True, "layer_type": layer_type, "filename": filename, "file_size": len(content)}

@router.delete("/data/{layer_type}")
async def delete_layer_data(layer_type: str):
    if layer_type not in LAYER_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid layer type")
    
    dm = get_data_manager()
    layer = dm.layers.get(layer_type)
    if not layer or not layer.file_path:
        raise HTTPException(status_code=404, detail="No data found")
    
    Path(layer.file_path).unlink(missing_ok=True)
    dm.layers[layer_type].file_path = None
    return {"success": True, "message": f"Deleted {layer_type} data"}

@router.post("/data/generate-sample")
async def generate_sample_data(layer_type: Optional[str] = None):
    if not RASTERIO_AVAILABLE:
        raise HTTPException(status_code=501, detail="Rasterio not installed")
    
    import numpy as np
    from rasterio.transform import from_bounds
    
    bounds = {'min_lat': 6.02, 'max_lat': 6.12, 'min_lon': -0.30, 'max_lon': -0.18}
    h, w = 100, 100
    transform = from_bounds(bounds['min_lon'], bounds['min_lat'], bounds['max_lon'], bounds['max_lat'], w, h)
    
    layers_to_gen = [layer_type] if layer_type and layer_type != 'all' else list(LAYER_TYPES.keys())
    generated = []
    dm = get_data_manager()
    
    for layer in layers_to_gen:
        np.random.seed(42 + hash(layer) % 1000)
        if layer == 'elevation':
            x, y = np.linspace(0, 4*np.pi, w), np.linspace(0, 4*np.pi, h)
            xx, yy = np.meshgrid(x, y)
            data = np.clip(200 + 50*np.sin(xx)*np.cos(yy) + 30*np.random.randn(h, w), 100, 400).astype(np.float32)
        elif layer == 'slope':
            data = np.clip(np.abs(15 + 10*np.random.randn(h, w)), 0, 45).astype(np.float32)
        elif layer == 'drainage':
            x, y = np.linspace(0, 1, w), np.linspace(0, 1, h)
            xx, yy = np.meshgrid(x, y)
            data = np.clip(500 + 400*np.sin(xx*3*np.pi) + 300*np.random.randn(h, w), 0, 2000).astype(np.float32)
        elif layer in ['soil', 'landuse', 'geology', 'landcover']:
            data = np.random.randint(1, 7, (h, w)).astype(np.int16)
        else:
            continue
        
        fname = f"{layer}_sample.tif"
        fpath = DATA_DIR / fname
        with rasterio.open(fpath, 'w', driver='GTiff', height=h, width=w, count=1, dtype=data.dtype,
                         crs='EPSG:4326', transform=transform, nodata=-9999 if np.issubdtype(data.dtype, np.floating) else -1) as dst:
            dst.write(data, 1)
        dm.update_layer_path(layer, str(fpath))
        generated.append({'layer': layer, 'filename': fname})
    
    return {"success": True, "message": f"Generated {len(generated)} sample layers", "layers": generated,
            "note": "Sample data is synthetic. Upload real data for research."}

@router.delete("/data/clear-all")
async def clear_all_data():
    dm = get_data_manager()
    deleted = []
    for lt, layer in dm.layers.items():
        if layer.file_path:
            Path(layer.file_path).unlink(missing_ok=True)
            deleted.append(lt)
            layer.file_path = None
    return {"success": True, "deleted_layers": deleted}
