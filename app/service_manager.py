from app.repositories.JournalRepository import JournalRepository
from app.services import JournalService


class ServiceManager:
    _journal_service_instance = None

    @classmethod
    def get_journal_service(cls) -> JournalService:
        if cls._journal_service_instance is None:
            journal_repository = JournalRepository()
            cls._journal_service_instance = JournalService(journal_repository)
        return cls._journal_service_instance
