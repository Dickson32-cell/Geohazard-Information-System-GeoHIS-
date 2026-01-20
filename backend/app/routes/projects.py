"""
GeoHIS Project Management Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

from app.database import get_db
from app.models.models import Project, ProjectDataset, ProjectAnalysis, User, ProjectStatus
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/projects", tags=["projects"])

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    study_area_name: Optional[str] = None
    tags: Optional[List[str]] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    status: str
    created_at: datetime
    class Config:
        from_attributes = True

@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(data: ProjectCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = Project(owner_id=user.id, name=data.name, description=data.description, study_area_name=data.study_area_name, tags=data.tags, status=ProjectStatus.active)
    db.add(p)
    db.commit()
    db.refresh(p)
    return ProjectResponse(id=str(p.id), name=p.name, description=p.description, status=p.status.value, created_at=p.created_at)

@router.get("")
async def list_projects(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    projects = db.query(Project).filter(Project.owner_id == user.id).all()
    return [{"id": str(p.id), "name": p.name, "status": p.status.value} for p in projects]

@router.get("/{project_id}")
async def get_project(project_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == project_id, Project.owner_id == user.id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"id": str(p.id), "name": p.name, "description": p.description}

@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == project_id, Project.owner_id == user.id).first()
    if p:
        db.delete(p)
        db.commit()
