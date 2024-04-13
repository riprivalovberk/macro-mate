from dataclasses import dataclass, field
from typing import List
import uuid

from app.models import DailyEntry

@dataclass
class Journal:
    owner_id: uuid.UUID
    entries: List[DailyEntry] = field(default_factory=list)  # Future: Store Daily Entry IDs, so we can load subsets. field(default_factory=list) ensures that each instance of the data class gets its own separate list
