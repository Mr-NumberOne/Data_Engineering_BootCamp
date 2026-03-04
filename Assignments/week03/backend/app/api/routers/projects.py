from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate
from app.models.user import User
from app.api.deps import get_current_user
from app.services.log_service import create_log

router = APIRouter()

@router.post("/", response_model=ProjectRead)
def create_project(project_in: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = Project(
        name=project_in.name,
        description=project_in.description,
        icon=project_in.icon,
        color=project_in.color,
        owner_id=current_user.id
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    
    create_log(db, "Project", project.id, project.id, "Created project", current_user.id)
    return project

@router.get("/", response_model=List[ProjectRead])
def read_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    projects = db.query(Project).filter(Project.owner_id == current_user.id).offset(skip).limit(limit).all()
    return projects

@router.get("/{project_id}", response_model=ProjectRead)
def read_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.put("/{project_id}", response_model=ProjectRead)
def update_project(project_id: int, project_in: ProjectUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project.name = project_in.name
    project.description = project_in.description
    if getattr(project_in, "icon", None) is not None:
        project.icon = project_in.icon
    if getattr(project_in, "color", None) is not None:
        project.color = project_in.color
        
    db.commit()
    db.refresh(project)
    
    create_log(db, "Project", project.id, project.id, "Updated project details", current_user.id)
    return project

@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()
    create_log(db, "Project", project_id, project_id, "Deleted project", current_user.id)
    return {"ok": True}
