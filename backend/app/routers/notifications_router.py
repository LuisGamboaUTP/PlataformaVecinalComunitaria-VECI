from typing import Optional
from fastapi import APIRouter, Cookie, Header
from app.core.config import settings
from app.core.security import resolve_current_user
from app.repositories.seed_store import NOTIFICATIONS

router = APIRouter(
    prefix="/api/app/notifications", tags=["6. Notifications (Bandeja Interna)"]
)


@router.get("")
def get_notifications(
    app_session: Optional[str] = Cookie(default=None, alias=settings.SESSION_COOKIE),
    x_user_id: Optional[str] = Header(default=None, alias="X-User-Id"),
):
    user = resolve_current_user(app_session, x_user_id, fallback_default=True)
    uid = str(user.get("id")) if user else "user-lucia"
    docs = [n for n in NOTIFICATIONS if n.get("ownerId") == uid]
    return {
        "notifications": docs,
        "unread": sum(1 for d in docs if not d.get("read")),
    }


@router.patch("")
def mark_notifications_read(
    app_session: Optional[str] = Cookie(default=None, alias=settings.SESSION_COOKIE),
    x_user_id: Optional[str] = Header(default=None, alias="X-User-Id"),
):
    user = resolve_current_user(app_session, x_user_id, fallback_default=True)
    uid = str(user.get("id")) if user else "user-lucia"
    for n in NOTIFICATIONS:
        if n.get("ownerId") == uid:
            n["read"] = True
    return {"success": True}
