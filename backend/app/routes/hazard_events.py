from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.services import HazardEventService
from app.schemas import HazardEvent, HazardEventCreate

router = APIRouter()

@router.post("/", response_model=HazardEvent)
def create_hazard_event(hazard_event: HazardEventCreate, db: Session = Depends(get_db)):
    return HazardEventService.create_hazard_event(db, hazard_event)

@router.get("/", response_model=List[HazardEvent])
def read_hazard_events(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return HazardEventService.get_hazard_events(db, skip, limit)

@router.get("/{hazard_event_id}", response_model=HazardEvent)
def read_hazard_event(hazard_event_id: str, db: Session = Depends(get_db)):
    hazard_events = HazardEventService.get_hazard_events(db)
    hazard_event = next((he for he in hazard_events if str(he.id) == hazard_event_id), None)
    if hazard_event is None:
        raise HTTPException(status_code=404, detail="Hazard event not found")
    return hazard_event

@router.put("/{hazard_event_id}", response_model=HazardEvent)
def update_hazard_event(hazard_event_id: str, hazard_event: HazardEventCreate, db: Session = Depends(get_db)):
    # For simplicity, delete and recreate
    hazard_events = HazardEventService.get_hazard_events(db)
    existing = next((he for he in hazard_events if str(he.id) == hazard_event_id), None)
    if existing is None:
        raise HTTPException(status_code=404, detail="Hazard event not found")
    db.delete(existing)
    return HazardEventService.create_hazard_event(db, hazard_event)

@router.delete("/{hazard_event_id}")
def delete_hazard_event(hazard_event_id: str, db: Session = Depends(get_db)):
    hazard_events = HazardEventService.get_hazard_events(db)
    hazard_event = next((he for he in hazard_events if str(he.id) == hazard_event_id), None)
    if hazard_event is None:
        raise HTTPException(status_code=404, detail="Hazard event not found")
    db.delete(hazard_event)
    db.commit()
    return {"message": "Hazard event deleted successfully"}