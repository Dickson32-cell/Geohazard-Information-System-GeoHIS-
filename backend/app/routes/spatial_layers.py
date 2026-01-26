from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import SpatialLayer as SpatialLayerModel
from app.schemas import SpatialLayer, SpatialLayerCreate

router = APIRouter()

@router.post("/spatial-layers/", response_model=SpatialLayer)
def create_spatial_layer(spatial_layer: SpatialLayerCreate, db: Session = Depends(get_db)):
    db_spatial_layer = SpatialLayerModel(**spatial_layer.dict())
    db.add(db_spatial_layer)
    db.commit()
    db.refresh(db_spatial_layer)
    return db_spatial_layer

@router.get("/spatial-layers/", response_model=List[SpatialLayer])
def read_spatial_layers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    spatial_layers = db.query(SpatialLayerModel).offset(skip).limit(limit).all()
    return spatial_layers

@router.get("/spatial-layers/{spatial_layer_id}", response_model=SpatialLayer)
def read_spatial_layer(spatial_layer_id: str, db: Session = Depends(get_db)):
    spatial_layer = db.query(SpatialLayerModel).filter(SpatialLayerModel.id == spatial_layer_id).first()
    if spatial_layer is None:
        raise HTTPException(status_code=404, detail="Spatial layer not found")
    return spatial_layer

@router.put("/spatial-layers/{spatial_layer_id}", response_model=SpatialLayer)
def update_spatial_layer(spatial_layer_id: str, spatial_layer: SpatialLayerCreate, db: Session = Depends(get_db)):
    db_spatial_layer = db.query(SpatialLayerModel).filter(SpatialLayerModel.id == spatial_layer_id).first()
    if db_spatial_layer is None:
        raise HTTPException(status_code=404, detail="Spatial layer not found")
    for key, value in spatial_layer.dict().items():
        setattr(db_spatial_layer, key, value)
    db.commit()
    db.refresh(db_spatial_layer)
    return db_spatial_layer

@router.delete("/spatial-layers/{spatial_layer_id}")
def delete_spatial_layer(spatial_layer_id: str, db: Session = Depends(get_db)):
    db_spatial_layer = db.query(SpatialLayerModel).filter(SpatialLayerModel.id == spatial_layer_id).first()
    if db_spatial_layer is None:
        raise HTTPException(status_code=404, detail="Spatial layer not found")
    db.delete(db_spatial_layer)
    db.commit()
    return {"message": "Spatial layer deleted successfully"}