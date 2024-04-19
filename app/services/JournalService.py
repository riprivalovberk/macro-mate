import uuid

from sqlalchemy.exc import NoResultFound

from app.models import Journal, Entry


class JournalService:
    """
    JournalService allows the user to view and edit their Journal data
    """

    def __init__(self, journal_repository):
        self.journal_repository = journal_repository

    def full_calculate_journal(self, journal_id: uuid.UUID):
        # Recalculates Journal stats (daily run?)

        pass

    def partial_calculate_journal(self, entry: Entry):
        # Recalculates Journal stats based on newly added data
        pass

    def calculate_day(self, day_id: uuid.UUID):
        # Calculates Day totals
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
            return self.journal_repository.find_by_user_id(user_id)
        except NoResultFound:
            raise ValueError("Journal not found")

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
            raise e
        return entry

    def update_entry(self, entry: Entry):
        success, e = self.journal_repository.update_entry(entry)
        if not success:
            raise e
        return entry

    def delete_entry(self, entry_id: uuid.UUID):
        success, e = self.journal_repository.delete_entry(entry_id)
        if not success:
            raise e
        return True
