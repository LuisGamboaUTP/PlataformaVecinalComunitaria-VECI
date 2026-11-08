from typing import Optional
from fastapi import APIRouter, Cookie, Header
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.security import resolve_current_user
from app.repositories.message_repository import MessageRepository
from app.schemas.message_schema import MessageCreateInput

router = APIRouter(prefix="/api/app/messages", tags=["4. Messages (Mensajería Contextual)"])


@router.get("")
def get_messages(
    interactionId: str = "",
    app_session: Optional[str] = Cookie(default=None, alias=settings.SESSION_COOKIE),
    x_user_id: Optional[str] = Header(default=None, alias="X-User-Id"),
):
    user = resolve_current_user(app_session, x_user_id, fallback_default=True)
    uid = str(user.get("id")) if user else "user-lucia"
    return {"messages": MessageRepository.list_by_interaction(interactionId, uid)}


@router.post("")
def create_message(
    payload: MessageCreateInput,
    app_session: Optional[str] = Cookie(default=None, alias=settings.SESSION_COOKIE),
    x_user_id: Optional[str] = Header(default=None, alias="X-User-Id"),
):
    user = resolve_current_user(app_session, x_user_id, fallback_default=True)
    uid = str(user.get("id")) if user else "user-lucia"
    new_message = MessageRepository.create(
        interaction_id=payload.interactionId, sender_id=uid, body=payload.body
    )
    return JSONResponse(status_code=201, content={"message": new_message})
