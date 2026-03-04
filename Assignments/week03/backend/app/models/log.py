from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class EditLog(Base):
    __tablename__ = "edit_logs"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String, nullable=False) # e.g. "Task", "Project"
    entity_id = Column(Integer, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    action = Column(String, nullable=False) # e.g. "Status changed from TODO to IN_PROGRESS"
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # relationships
    user = relationship("User", backref="activity_logs")
    project = relationship("Project", backref="activity_logs")
