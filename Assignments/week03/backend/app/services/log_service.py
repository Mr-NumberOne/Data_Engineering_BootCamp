from sqlalchemy.orm import Session
from app.models.log import EditLog

def create_log(db: Session, entity_type: str, entity_id: int, project_id: int, action: str, user_id: int):
    log = EditLog(
        entity_type=entity_type, 
        entity_id=entity_id, 
        project_id=project_id,
        action=action, 
        user_id=user_id
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
