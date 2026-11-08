from typing import Optional
from fastapi import APIRouter, Cookie, Header
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.security import resolve_current_user
from app.repositories.interaction_repository import InteractionRepository
from app.schemas.interaction_schema import InteractionActionInput, InteractionCreateInput

router = APIRouter(
    prefix="/api/app/interactions", tags=["3. Interactions (Flujo Operativo)"]
)


@router.get("")
def get_interactions(
    app_session: Optional[str] = Cookie(default=None, alias=settings.SESSION_COOKIE),
    x_user_id: Optional[str] = Header(default=None, alias="X-User-Id"),
):
    user = resolve_current_user(app_session, x_user_id, fallback_default=True)
    uid = str(user.get("id")) if user else "user-lucia"
    return {"interactions": InteractionRepository.list_by_user(uid)}


@router.post("")
def create_interaction(
    payload: InteractionCreateInput,
    app_session: Optional[str] = Cookie(default=None, alias=settings.SESSION_COOKIE),
    x_user_id: Optional[str] = Header(default=None, alias="X-User-Id"),
):
    user = resolve_current_user(app_session, x_user_id, fallback_default=True)
    uid = str(user.get("id")) if user else "user-lucia"
    interaction, replayed = InteractionRepository.create_idempotent(
        uid=uid,
        listing_id=payload.listingId,
        listing_title_fallback=payload.listingTitle,
        interaction_type=payload.type,
        idempotency_key=payload.idempotencyKey,
    )
    if replayed:
        return {"interaction": interaction, "replayed": True}
    return JSONResponse(status_code=201, content={"interaction": interaction})


@router.patch("/{interaction_id}")
def update_interaction(
    interaction_id: str,
    payload: InteractionActionInput,
    app_session: Optional[str] = Cookie(default=None, alias=settings.SESSION_COOKIE),
    x_user_id: Optional[str] = Header(default=None, alias="X-User-Id"),
):
    user = resolve_current_user(app_session, x_user_id, fallback_default=True)
    uid = str(user.get("id")) if user else "user-lucia"
    updated = InteractionRepository.transition_state(
        interaction_id=interaction_id, action=payload.action, uid=uid
    )
    if not updated:
        return JSONResponse(
            status_code=404,
            content={"error": {"message": "No encontramos esta operación."}},
        )
    return {"interaction": updated}
