from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.log import EditLog
from app.schemas.log import LogRead
from app.models.user import User
from app.api.deps import get_current_user

from sqlalchemy.orm import Session, joinedload

router = APIRouter()

@router.get("/", response_model=List[LogRead])
def read_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logs = db.query(EditLog).options(joinedload(EditLog.project)).filter(EditLog.user_id == current_user.id).order_by(EditLog.timestamp.desc()).offset(skip).limit(limit).all()
    return logs
