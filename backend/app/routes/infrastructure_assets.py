from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import InfrastructureAsset as InfrastructureAssetModel
from app.schemas import InfrastructureAsset, InfrastructureAssetCreate

router = APIRouter()

@router.post("/infrastructure-assets/", response_model=InfrastructureAsset)
def create_infrastructure_asset(infrastructure_asset: InfrastructureAssetCreate, db: Session = Depends(get_db)):
    db_infrastructure_asset = InfrastructureAssetModel(**infrastructure_asset.dict())
    db.add(db_infrastructure_asset)
    db.commit()
    db.refresh(db_infrastructure_asset)
    return db_infrastructure_asset

@router.get("/infrastructure-assets/", response_model=List[InfrastructureAsset])
def read_infrastructure_assets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    infrastructure_assets = db.query(InfrastructureAssetModel).offset(skip).limit(limit).all()
    return infrastructure_assets

@router.get("/infrastructure-assets/{infrastructure_asset_id}", response_model=InfrastructureAsset)
def read_infrastructure_asset(infrastructure_asset_id: str, db: Session = Depends(get_db)):
    infrastructure_asset = db.query(InfrastructureAssetModel).filter(InfrastructureAssetModel.id == infrastructure_asset_id).first()
    if infrastructure_asset is None:
        raise HTTPException(status_code=404, detail="Infrastructure asset not found")
    return infrastructure_asset

@router.put("/infrastructure-assets/{infrastructure_asset_id}", response_model=InfrastructureAsset)
def update_infrastructure_asset(infrastructure_asset_id: str, infrastructure_asset: InfrastructureAssetCreate, db: Session = Depends(get_db)):
    db_infrastructure_asset = db.query(InfrastructureAssetModel).filter(InfrastructureAssetModel.id == infrastructure_asset_id).first()
    if db_infrastructure_asset is None:
        raise HTTPException(status_code=404, detail="Infrastructure asset not found")
    for key, value in infrastructure_asset.dict().items():
        setattr(db_infrastructure_asset, key, value)
    db.commit()
    db.refresh(db_infrastructure_asset)
    return db_infrastructure_asset

@router.delete("/infrastructure-assets/{infrastructure_asset_id}")
def delete_infrastructure_asset(infrastructure_asset_id: str, db: Session = Depends(get_db)):
    db_infrastructure_asset = db.query(InfrastructureAssetModel).filter(InfrastructureAssetModel.id == infrastructure_asset_id).first()
    if db_infrastructure_asset is None:
        raise HTTPException(status_code=404, detail="Infrastructure asset not found")
    db.delete(db_infrastructure_asset)
    db.commit()
    return {"message": "Infrastructure asset deleted successfully"}