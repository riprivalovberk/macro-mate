from sqlalchemy.orm import relationship

import uuid

from sqlalchemy import Column, ForeignKey, String, Float, UUID, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Entry(Base):
    __tablename__ = "entries"

    day = relationship("Day", back_populates="entries")

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    day_id = Column(UUID(as_uuid=True), ForeignKey('days.id'))

    name = Column(String(32), nullable=False)
    proteins = Column(Float)
    carbohydrates = Column(Float)
    fats = Column(Float)
    calories = Column(Float)
    water_intake = Column(Float)
    notes = Column(Text)


    def __repr__(self):
        return f"({self.entry_id}, {self.date}, {self.name})"
