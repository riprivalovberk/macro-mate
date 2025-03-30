from pydantic import BaseModel
from datetime import date

from sqlalchemy.orm import relationship

from app.database import Base
import uuid
from sqlalchemy import Column, ForeignKey, Integer, String, Float, Date, Text, UUID


class Journal(Base):
    __tablename__ = 'journals'

    days = relationship("Day", back_populates="journal")  # Relationship to entries

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    streak = Column(Integer)
    weight_goal = Column(Float, nullable=True)
