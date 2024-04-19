import uuid

from sqlalchemy.exc import SQLAlchemyError

from app.models import Entry, Journal


class JournalRepository:
    def __init__(self, db_session):
        self.db_session = db_session

    def get_journal(self, owner_id: uuid.UUID):
        # Fetch and return all days/entries associated with owner_id. Return null if no entry
        try:
            journal = self.db_session.query(Journal).filter_by(owner_id=owner_id).first()
            if journal:
                return True, journal
            else:
                return False, "Journal not found"
        except SQLAlchemyError as e:
            self.db_session.rollback()
            return False, e

    def add_entry(self, entry: Entry):
        # Insert a new entry into the database
        try:
            self.db_session.add(entry)
            self.db_session.commit()
            return True, entry
        except SQLAlchemyError as e:
            self.db_session.rollback()
            return False, e

    def delete_entry(self, entry_id: uuid.UUID):
        try:
            entry = self.db_session.query(Entry).filter_by(id=entry_id).first()
            if entry:
                self.db_session.delete(entry)
                self.db_session.commit()
                return True, None
            else:
                return False, "Entry not found"
        except SQLAlchemyError as e:
            self.db_session.rollback()
            return False, e

    def update_entry(self, entry: Entry):
        # Update an entry with new values in the database
        try:
            self.db_session.add(entry)  # Should overwrite b/c same ID
            self.db_session.commit()
            return True, entry
        except SQLAlchemyError as e:
            self.db_session.rollback()
            return False, e
