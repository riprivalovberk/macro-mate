from app.repositories.JournalRepository import JournalRepository
from app.services.JournalService import JournalService
from app.database import get_db


class ServiceManager:
    _journal_service_instance = None

    @classmethod
    def get_journal_service(cls) -> JournalService:
        if cls._journal_service_instance is None:
            # Obtain a database session from the scoped session
            db_session = get_db()
            journal_repository = JournalRepository(db_session)
            cls._journal_service_instance = JournalService(journal_repository)
        return cls._journal_service_instance
