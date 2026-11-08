import sys
from pathlib import Path
from typing import Any, Dict, Literal, Optional, overload

_backend_dir = str(Path(__file__).resolve().parent.parent.parent)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from app.core.database import get_supabase
from app.repositories.seed_store import USERS


@overload
def resolve_current_user(
    cookie_val: Optional[str] = None,
    x_user_id: Optional[str] = None,
    fallback_default: Literal[True] = ...,
) -> Dict[str, Any]:
    ...


@overload
def resolve_current_user(
    cookie_val: Optional[str] = None,
    x_user_id: Optional[str] = None,
    fallback_default: Literal[False] = ...,
) -> Optional[Dict[str, Any]]:
    ...


@overload
def resolve_current_user(
    cookie_val: Optional[str] = None,
    x_user_id: Optional[str] = None,
    fallback_default: bool = False,
) -> Optional[Dict[str, Any]]:
    ...


def resolve_current_user(
    cookie_val: Optional[str] = None,
    x_user_id: Optional[str] = None,
    fallback_default: bool = False,
) -> Optional[Dict[str, Any]]:
    """Resuelve el usuario autenticado por Cookie o por Header X-User-Id (para Postman)."""
    raw = cookie_val or x_user_id
    if not raw:
        return USERS[0] if fallback_default else None

    user_id = raw.replace("fastapi:", "").strip()
    for user in USERS:
        if str(user["id"]) == user_id or str(user["email"]).lower() == user_id.lower():
            return user

    supabase = get_supabase()
    if supabase:
        try:
            res = (
                supabase.table("profiles")
                .select("*")
                .or_(f"id.eq.{user_id},email.eq.{user_id}")
                .limit(1)
                .execute()
            )
            if res.data:
                row = res.data[0]
                return {
                    "id": str(row["id"]),
                    "email": str(row["email"]),
                    "displayName": str(row["display_name"]),
                    "zoneName": str(row["zone_name"]),
                    "bio": row.get("bio"),
                    "verificationStatus": str(row.get("verification_status") or "not-verified"),
                }
        except Exception:
            pass

    return USERS[0] if fallback_default else None
