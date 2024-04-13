from http.client import HTTPException
from uuid import UUID

from fastapi import APIRouter, Depends
from ..dependencies import verify_token
from ..models.DailyEntry import DailyEntry
from ..services import JournalService
from ..service_manager import ServiceManager

router = APIRouter()

@router.get("/")
async def read_root(token: str = Depends(verify_token)):
    return {"Hello": "World"}

@router.get("/hello/{name}")
async def read_item(name: str):
    return {"Hello": name}

@router.post("/users/{user_id}/journal/")
async def add_journal_entry(user_id: UUID, entry: DailyEntry,
                            journal_service: JournalService = Depends(ServiceManager.get_journal_service)):
    try:
        return journal_service.add_entry_to_journal(user_id, entry)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))