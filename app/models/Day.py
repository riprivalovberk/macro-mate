from pydantic import BaseModel
from datetime import date

from sqlalchemy.orm import relationship, object_session

from app.database import Base
import uuid
from sqlalchemy import Column, ForeignKey, Float, Date, UUID, Boolean


class Day(Base):
    __tablename__ = 'days'

    entries = relationship("Entry", back_populates="day")  # Relationship to entries
    journal = relationship("Journal", back_populates="days")

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    journal_id = Column(UUID(as_uuid=True), ForeignKey('journals.id'))

    date = Column(Date, unique=True)
    daily_calorie_goal = Column(Float)
    total_proteins = Column(Float)
    total_carbohydrates = Column(Float)
    total_fats = Column(Float)
    total_calories = Column(Float)
    total_water_intake = Column(Float)
    weight = Column(Float)
    workout_completed = Column(Boolean)

    def __repr__(self):
        return f'Id: {self.id}, Date: {self.date}, Journal: {self.journal}, Date: {self.date}, Daily calories goal: {self}'