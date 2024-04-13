from datetime import date
import uuid
from typing import Optional

from app.models import DailyEntry


class JournalRepository:
    def __init__(self, db_connection):
        self.db_connection = db_connection

    def add_entry(self, owner_id: uuid.UUID, entry: DailyEntry):
        # Insert a new entry into the database
        pass

    def get_entry_by_date(self, owner_id: uuid.UUID, start_date: date, end_date: date) -> Optional[DailyEntry]:
        # Fetch and return an entry by date range from the database (inclusive). Return null if no entry
        pass

    def delete_entry(self, entry_id: uuid.UUID):
        # Delete an entry from the database
        pass

    def update_entry(self, entry_id: uuid.UUID, **kwargs):
        # Update an entry with new values in the database
        pass
