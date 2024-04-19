from http.client import HTTPException
from uuid import UUID

from fastapi import APIRouter, Depends
from ..dependencies import verify_token
from ..models.Entry import Entry
from ..services import JournalService
from ..service_manager import ServiceManager

router = APIRouter()


@router.get("/")
async def read_root(token: str = Depends(verify_token)):
    return {"Hello": "World"}


@router.get("/hello/{name}")
async def read_item(name: str):
    return {"Hello": name}


@router.get("/users/{user_id}/journal/")
async def get_journal(user_id: UUID, journal_service: JournalService = Depends(ServiceManager.get_journal_service)):
    try:
        return journal_service.get_journal(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users/{user_id}/journal/entry")
async def add_journal_entry(user_id: UUID, entry: Entry,
                            journal_service: JournalService = Depends(ServiceManager.get_journal_service)):
    try:
        return journal_service.add_entry_to_journal(user_id, entry)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
