from datetime import date
import uuid
from typing import Optional

from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.models import Entry


class JournalRepository:
    def __init__(self, db_session):
        self.db_session = db_session

    def add_entry(self, entry: Entry):
        # Insert a new entry into the database
        attempts = 2
        while attempts > 0:
            try:
                self.db_session.add(entry)
                self.db_session.commit()
                return True, entry
            except SQLAlchemyError as e:
                self.db_session.rollback()
                if attempts == 1:
                    return False, str(e)
                else:
                    print('LOG: Restarting db_session')
                    self.db_session = get_db()
            attempts -= 1
        return False, 'Something went wrong'

    def get_entries(self, owner_id: uuid.UUID):
        # Fetch and return all entries associated with owner_id. Return null if no entry
        try:
            entries = self.db_session.query(Entry).filter_by(owner_id=owner_id).all()
            return True, entries
        except SQLAlchemyError as e:
            return False, str(e)

    def get_entry_by_date(self, owner_id: uuid.UUID, start_date: date, end_date: date):
        # Fetch and return an entry by date range from the database (inclusive). Return null if no entry
        pass

    def delete_entry(self, entry_id: uuid.UUID):
        # Delete an entry from the database
        pass

    def update_entry(self, entry_id: uuid.UUID, **kwargs):
        # Update an entry with new values in the database
        pass
