from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import HazardZone as HazardZoneModel
from app.schemas import HazardZone, HazardZoneCreate

router = APIRouter()

@router.post("/hazard-zones/", response_model=HazardZone)
def create_hazard_zone(hazard_zone: HazardZoneCreate, db: Session = Depends(get_db)):
    db_hazard_zone = HazardZoneModel(**hazard_zone.dict())
    db.add(db_hazard_zone)
    db.commit()
    db.refresh(db_hazard_zone)
    return db_hazard_zone

@router.get("/hazard-zones/", response_model=List[HazardZone])
def read_hazard_zones(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    hazard_zones = db.query(HazardZoneModel).offset(skip).limit(limit).all()
    return hazard_zones

@router.get("/hazard-zones/{hazard_zone_id}", response_model=HazardZone)
def read_hazard_zone(hazard_zone_id: str, db: Session = Depends(get_db)):
    hazard_zone = db.query(HazardZoneModel).filter(HazardZoneModel.id == hazard_zone_id).first()
    if hazard_zone is None:
        raise HTTPException(status_code=404, detail="Hazard zone not found")
    return hazard_zone

@router.put("/hazard-zones/{hazard_zone_id}", response_model=HazardZone)
def update_hazard_zone(hazard_zone_id: str, hazard_zone: HazardZoneCreate, db: Session = Depends(get_db)):
    db_hazard_zone = db.query(HazardZoneModel).filter(HazardZoneModel.id == hazard_zone_id).first()
    if db_hazard_zone is None:
        raise HTTPException(status_code=404, detail="Hazard zone not found")
    for key, value in hazard_zone.dict().items():
        setattr(db_hazard_zone, key, value)
    db.commit()
    db.refresh(db_hazard_zone)
    return db_hazard_zone

@router.delete("/hazard-zones/{hazard_zone_id}")
def delete_hazard_zone(hazard_zone_id: str, db: Session = Depends(get_db)):
    db_hazard_zone = db.query(HazardZoneModel).filter(HazardZoneModel.id == hazard_zone_id).first()
    if db_hazard_zone is None:
        raise HTTPException(status_code=404, detail="Hazard zone not found")
    db.delete(db_hazard_zone)
    db.commit()
    return {"message": "Hazard zone deleted successfully"}