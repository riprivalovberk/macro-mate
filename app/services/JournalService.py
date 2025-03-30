import uuid
from typing import Optional

from sqlalchemy.exc import NoResultFound

from app.models import Journal, Entry, Day


class JournalService:
    """
    JournalService allows the user to view and edit their Journal data
    """

    def __init__(self, journal_repository):
        self.journal_repository = journal_repository

    def full_calculate_journal(self, user_id: uuid.UUID):
        # Recalculates Journal stats (daily run?)
        journal = self.journal_repository.get_journal(user_id)
        if journal is None:
            print(f'Day with id {user_id} does not exist')
            return False
        for day in journal.days:
            self.recalculate_day_totals(day.id, day)
        return True

    def recalculate_day_totals(self, day_id: uuid.UUID, day: Optional[Day] = None):
        """
        Recalculates and updates the totals for a given day.

        Parameters:
        - day_id (uuid.UUID): The unique identifier for the day.

        Returns:
        - bool: True if the recalculation and update were successful, False otherwise.
        """
        if not day:
            day = self.journal_repository.get_day(day_id)
        if day is None:
            print(f'Day with id {day_id} does not exist')
            return False
        return self.journal_repository.recalculate_day_totals(day)

    def create_journal(self):
        pass
    def create_day(self):
        pass

    def get_journal(self, user_id: uuid.UUID) -> Journal:
        """
        Fetches the journal corresponding to the given user_id.

        Parameters:
        - user_id (UUID): The unique identifier for the user whose journal is to be retrieved.

        Returns:
        - Journal object or raises an exception if not found.
        """
        try:
            return self.journal_repository.get_journal(user_id)
        except ValueError as e:
            print(f"Value error encountered: {str(e)}")
            raise ValueError("A value error occurred while fetching the journal.") from e
        except Exception as e:
            print(f"Unexpected error encountered: {str(e)}")
            raise Exception("An unexpected error occurred while processing your request.") from e

    def add_entry(self, entry: Entry):
        """
        Adds an entry to the DB and updates the Journal Calculations based on the entry.
        Note: Entry should automatically create its own UUID.

        Parameters:
        - entry (Entry): The entry filled out by the user.

        Returns:
        - Entry object after it is added to the database.
        """
        success, e = self.journal_repository.add_entry(entry)
        if not success:
            print(f"Unexpected error encountered: {str(e)}")
            raise Exception("An unexpected error occurred while processing your request.") from e
        return entry

    def update_entry(self, entry: Entry):
        success, e = self.journal_repository.update_entry(entry)
        if not success:
            print(f"Unexpected error encountered: {str(e)}")
            raise Exception("An unexpected error occurred while processing your request.") from e
        return entry

    def delete_entry(self, entry_id: uuid.UUID):
        success, e = self.journal_repository.delete_entry(entry_id)
        if not success:
            print(f"Unexpected error encountered: {str(e)}")
            raise Exception("An unexpected error occurred while processing your request.") from e
        return True
