from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class LogBase(BaseModel):
    entity_type: str
    entity_id: int
    project_id: Optional[int] = None
    action: str

class LogCreate(LogBase):
    user_id: int

class LogProjectInfo(BaseModel):
    id: int
    name: str
    icon: Optional[str] = "Folder"
    color: Optional[str] = "#476EAE"

    class Config:
        from_attributes = True

class LogRead(LogBase):
    id: int
    user_id: int
    timestamp: datetime
    project: Optional[LogProjectInfo] = None

    class Config:
        from_attributes = True
