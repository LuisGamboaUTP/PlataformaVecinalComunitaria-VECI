import time
from typing import Any, Dict, List, Optional, Tuple, cast
from app.core.database import get_supabase
from app.repositories.seed_store import (
    INTERACTIONS,
    LISTINGS,
    map_supabase_interaction,
    now_iso,
)


class InteractionRepository:
    @staticmethod
    def list_by_user(uid: str, limit: int = 30) -> List[Dict[str, Any]]:
        supabase = get_supabase()
        if supabase:
            try:
                res = (
                    supabase.table("interactions")
                    .select("*")
                    .order("updated_at", desc=True)
                    .limit(limit)
                    .execute()
                )
                if res.data and isinstance(res.data, list):
                    return [
                        map_supabase_interaction(cast(Dict[str, Any], row), uid)
                        for row in res.data
                        if isinstance(row, dict)
                    ]
            except Exception:
                pass

        items = []
        for i in INTERACTIONS:
            if i.get("requesterId") == uid or i.get("providerId") == uid:
                items.append(
                    {
                        "id": i["id"],
                        "summary": i["summary"],
                        "type": i["type"],
                        "status": i["status"],
                        "syncState": i.get("syncState", "confirmed"),
                        "listingTitle": i["listingTitle"],
                        "updatedAt": i["updatedAt"],
                        "role": "provider" if i.get("providerId") == uid else "requester",
                        "returnFlow": i.get("returnFlow"),
                    }
                )
        return items

    @staticmethod
    def create_idempotent(
        uid: str,
        listing_id: str,
        listing_title_fallback: Optional[str],
        interaction_type: str,
        idempotency_key: str,
    ) -> Tuple[Dict[str, Any], bool]:
        listing = next((l for l in LISTINGS if l["id"] == listing_id), None)
        listing_title = (
            listing["title"]
            if listing
            else (listing_title_fallback or "Publicación vecinal")
        )
        provider_id = "user-lucia" if uid == "user-carlos" else "user-carlos"
        status_val = "proposed" if interaction_type == "barter" else "requested"
        summary_val = (
            f"{'Propuesta' if interaction_type == 'barter' else 'Solicitud'}: {listing_title}"
        )

        supabase = get_supabase()
        if supabase:
            try:
                res = (
                    supabase.table("interactions")
                    .upsert(
                        {
                            "idempotency_key": idempotency_key,
                            "listing_id": listing_id,
                            "listing_title": listing_title,
                            "requester_id": uid,
                            "provider_id": provider_id,
                            "type": interaction_type,
                            "status": status_val,
                            "summary": summary_val,
                        },
                        on_conflict="idempotency_key",
                    )
                    .execute()
                )
                if res.data and isinstance(res.data, list) and len(res.data) > 0:
                    first_row = cast(Dict[str, Any], res.data[0])
                    return map_supabase_interaction(first_row, uid), False
            except Exception:
                pass

        for existing in INTERACTIONS:
            if (
                existing.get("idempotencyKey") == idempotency_key
                and existing.get("requesterId") == uid
            ):
                return {**existing, "role": "requester"}, True

        new_int = {
            "id": f"int-{int(time.time() * 1000)}",
            "idempotencyKey": idempotency_key,
            "listingId": listing_id,
            "listingTitle": listing_title,
            "requesterId": uid,
            "providerId": provider_id,
            "summary": summary_val,
            "type": interaction_type,
            "status": status_val,
            "syncState": "confirmed",
            "updatedAt": now_iso(),
        }
        INTERACTIONS.insert(0, new_int)
        return {**new_int, "role": "requester"}, False

    @staticmethod
    def transition_state(
        interaction_id: str, action: str, uid: str
    ) -> Optional[Dict[str, Any]]:
        supabase = get_supabase()
        if supabase:
            try:
                update_fields: Dict[str, Any] = {"updated_at": now_iso()}
                if action == "accept":
                    update_fields["status"] = "accepted"
                elif action == "reject":
                    update_fields["status"] = "rejected"
                elif action == "cancel":
                    update_fields["status"] = "cancelled"
                elif action == "start":
                    update_fields["status"] = "in-progress"
                elif action == "mark-delivered":
                    update_fields["status"] = "return-pending"
                    update_fields["loan_due_at"] = now_iso(7 * 24 * 60)
                    update_fields["borrower_confirmed"] = False
                    update_fields["lender_confirmed"] = False
                elif action == "confirm-return":
                    update_fields["borrower_confirmed"] = True
                elif action in ("close-return", "confirm-complete"):
                    update_fields["status"] = "completed"
                    update_fields["borrower_confirmed"] = True
                    update_fields["lender_confirmed"] = True

                res = (
                    supabase.table("interactions")
                    .update(update_fields)
                    .eq("id", interaction_id)
                    .execute()
                )
                if res.data and isinstance(res.data, list) and len(res.data) > 0:
                    first_row = cast(Dict[str, Any], res.data[0])
                    return map_supabase_interaction(first_row, uid)
            except Exception:
                pass

        item = next((i for i in INTERACTIONS if i["id"] == interaction_id), None)
        if not item:
            return None

        if action == "accept":
            item["status"] = "accepted"
        elif action == "reject":
            item["status"] = "rejected"
        elif action == "cancel":
            item["status"] = "cancelled"
        elif action == "start":
            item["status"] = "in-progress"
        elif action == "mark-delivered":
            item["status"] = "return-pending"
            item["returnFlow"] = {
                "dueAt": now_iso(7 * 24 * 60),
                "borrowerConfirmed": False,
                "lenderConfirmed": False,
            }
        elif action == "confirm-return":
            rf = item.get("returnFlow") or {}
            rf["borrowerConfirmed"] = True
            item["returnFlow"] = rf
        elif action in ("close-return", "confirm-complete"):
            item["status"] = "completed"
            if item.get("returnFlow"):
                item["returnFlow"]["borrowerConfirmed"] = True
                item["returnFlow"]["lenderConfirmed"] = True

        item["updatedAt"] = now_iso()
        return {
            **item,
            "role": "provider" if item.get("providerId") == uid else "requester",
        }
