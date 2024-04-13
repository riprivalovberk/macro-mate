from dataclasses import dataclass, field
from datetime import date
import uuid
from typing import Optional

@dataclass
class UserInfo:
    first_name: str
    last_name: str
    birth_date: date
    email: str
    height: float
    initial_weight: float
    sex: str

    weight_goal: Optional[float] = None
    # fitness_goal: FitnessGoal

    id: uuid.UUID = field(default_factory=uuid.uuid4)  # Generates a unique ID for each user

