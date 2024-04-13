from dataclasses import dataclass
from pydantic import BaseModel
from datetime import date
import uuid


@dataclass
class DailyEntry(BaseModel):
    entry_id: uuid.UUID
    date: date
    name: str  # required food name
    proteins: float  # grams
    carbohydrates: float  # grams
    fats: float  # grams
    calories: int  # optional, calculated from macros if not provided
    water_intake: float  # liters
    notes: str  # Any additional observations or notes
