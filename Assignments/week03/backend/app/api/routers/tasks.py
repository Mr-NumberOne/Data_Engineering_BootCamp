from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.task import Task
from app.models.project import Project
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate
from app.models.user import User
from app.api.deps import get_current_user
from app.services.log_service import create_log

router = APIRouter()

@router.post("/", response_model=TaskRead)
def create_task(task_in: TaskCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify project belongs to user
    project = db.query(Project).filter(Project.id == task_in.project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    task = Task(
        title=task_in.title,
        description=task_in.description,
        status=task_in.status if task_in.status else "TODO",
        project_id=task_in.project_id,
        assigned_to=task_in.assigned_to
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    
    create_log(db, "Task", task.id, project.id, f"Created task in project {project.name}", current_user.id)
    return task

@router.get("/project/{project_id}", response_model=List[TaskRead])
def read_tasks(project_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    tasks = db.query(Task).filter(Task.project_id == project_id).offset(skip).limit(limit).all()
    return tasks

@router.put("/{task_id}", response_model=TaskRead)
def update_task(task_id: int, task_in: TaskUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Task).join(Project).filter(Task.id == task_id, Project.owner_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    old_status = task.status
    if task_in.title is not None:
        task.title = task_in.title
    if task_in.description is not None:
        task.description = task_in.description
    if task_in.status is not None:
        task.status = task_in.status
    if task_in.assigned_to is not None:
        task.assigned_to = task_in.assigned_to
        
    db.commit()
    db.refresh(task)
    
    action = "Updated task details"
    if old_status != task.status:
        action = f"Changed task status to {task.status}"
        
    create_log(db, "Task", task.id, task.project_id, action, current_user.id)
    return task

@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Task).join(Project).filter(Task.id == task_id, Project.owner_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(task)
    db.commit()
    create_log(db, "Task", task_id, task.project_id, "Deleted task", current_user.id)
    return {"ok": True}
