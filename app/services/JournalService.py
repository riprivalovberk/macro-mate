from app.models import Journal


class JournalService:
    """
    JournalService allows the user to view and edit their Journal data
    """

    def __init__(self, journal_repository):
        self.journal_repository = journal_repository

    def get_journal_for_user(self, user_id) -> Journal:
        """
        Fetches the journal corresponding to the given user_id.

        Parameters:
        - user_id (UUID): The unique identifier for the user whose journal is to be retrieved.

        Returns:
        - Journal: The journal associated with the user, or None if no journal exists.
        """
        return self.journal_repository.find_by_user_id(user_id)
