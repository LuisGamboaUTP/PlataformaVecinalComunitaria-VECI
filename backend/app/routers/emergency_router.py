from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.repositories.emergency_repository import EmergencyRepository
from app.schemas.emergency_schema import EmergencyBoardInput

router = APIRouter(
    prefix="/api/app/emergency", tags=["8. Emergency Board (Tablero de Emergencias)"]
)


@router.get("")
def get_emergency_board():
    return {"items": EmergencyRepository.list_items()}


@router.post("")
def create_emergency_item(payload: EmergencyBoardInput):
    item = EmergencyRepository.create_item(
        kind=payload.kind,
        title=payload.title,
        zone_name=payload.zoneName,
        source=payload.source,
    )
    return JSONResponse(status_code=201, content={"item": item})
