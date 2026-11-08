import time
from typing import Any, Dict, List, Optional, cast
from app.core.database import get_supabase
from app.repositories.seed_store import USERS


class AuthRepository:
    @staticmethod
    def find_by_credentials(identifier: str, password: str) -> Optional[Dict[str, Any]]:
        clean_id = identifier.strip().lower()
        matched = next(
            (
                u
                for u in USERS
                if (u["email"].lower() == clean_id or str(u.get("docNumber", "")).lower() == clean_id)
                and u["password"] == password
            ),
            None,
        )
        if matched:
            return matched

        supabase = get_supabase()
        if supabase:
            try:
                res = (
                    supabase.table("profiles")
                    .select("*")
                    .or_(f"email.eq.{clean_id},doc_number.eq.{clean_id.upper()}")
                    .limit(1)
                    .execute()
                )
                if res.data and isinstance(res.data, list) and len(res.data) > 0:
                    row = cast(Dict[str, Any], res.data[0])
                    return {
                        "id": str(row["id"]),
                        "email": str(row["email"]),
                        "password": password,
                        "displayName": str(row["display_name"]),
                        "zoneName": str(row["zone_name"]),
                        "bio": row.get("bio"),
                        "verificationStatus": str(row.get("verification_status") or "verified"),
                        "docType": row.get("doc_type"),
                        "docNumber": row.get("doc_number"),
                    }
            except Exception:
                pass
        return None

    @staticmethod
    def register_profile(
        email: str,
        password: str,
        display_name: str,
        zone_name: str,
        doc_type: Optional[str],
        doc_number: Optional[str],
        verification_status: str,
    ) -> Dict[str, Any]:
        user_id = f"user-{int(time.time() * 1000)}"
        supabase = get_supabase()
        if supabase:
            try:
                res = (
                    supabase.table("profiles")
                    .upsert(
                        {
                            "email": email,
                            "display_name": display_name,
                            "zone_name": zone_name,
                            "doc_type": doc_type.upper() if doc_type else None,
                            "doc_number": doc_number.upper() if doc_number else None,
                            "verification_status": verification_status,
                        },
                        on_conflict="email",
                    )
                    .execute()
                )
                if res.data and isinstance(res.data, list) and len(res.data) > 0:
                    first_row = cast(Dict[str, Any], res.data[0])
                    user_id = str(first_row.get("id", user_id))
            except Exception:
                pass

        new_user = {
            "id": user_id,
            "email": email,
            "password": password,
            "displayName": display_name,
            "zoneName": zone_name,
            "bio": "",
            "verificationStatus": (
                "verified" if verification_status == "verified" else "not-verified"
            ),
        }
        USERS.append(new_user)
        return new_user

    @staticmethod
    def update_profile(
        user: Dict[str, Any],
        doc_type: Optional[str] = None,
        doc_number: Optional[str] = None,
    ) -> Dict[str, Any]:
        supabase = get_supabase()
        if supabase and user.get("email"):
            try:
                update_payload: Dict[str, Any] = {
                    "email": user["email"],
                    "display_name": user.get("displayName") or "Vecino",
                    "zone_name": user.get("zoneName") or "Centro Cívico",
                    "bio": user.get("bio"),
                    "verification_status": user.get("verificationStatus") or "unverified",
                }
                if doc_type in ("DNI", "CE"):
                    update_payload["doc_type"] = doc_type
                    update_payload["doc_number"] = doc_number
                supabase.table("profiles").upsert(update_payload, on_conflict="email").execute()
            except Exception:
                pass
        return user
