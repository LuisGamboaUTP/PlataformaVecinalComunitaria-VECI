import time
from typing import Any, Dict, List, cast
from app.core.database import get_supabase
from app.repositories.seed_store import MESSAGES, now_iso


class MessageRepository:
    @staticmethod
    def list_by_interaction(interaction_id: str, uid: str) -> List[Dict[str, Any]]:
        supabase = get_supabase()
        if supabase and interaction_id:
            try:
                res = (
                    supabase.table("messages")
                    .select("*")
                    .eq("interaction_id", interaction_id)
                    .order("created_at", desc=False)
                    .limit(100)
                    .execute()
                )
                if res.data and isinstance(res.data, list):
                    return [
                        {
                            "id": str(row.get("id")),
                            "body": str(row.get("body")),
                            "sentByMe": str(row.get("sender_id")) == uid,
                            "deliveryState": str(row.get("delivery_state") or "sent"),
                            "createdAt": row.get("created_at"),
                        }
                        for row in res.data
                        if isinstance(row, dict)
                    ]
            except Exception:
                pass

        return [
            {
                "id": m["id"],
                "body": m["body"],
                "sentByMe": m["senderId"] == uid,
                "deliveryState": m.get("deliveryState", "sent"),
                "createdAt": m.get("createdAt"),
            }
            for m in MESSAGES
            if not interaction_id or m["interactionId"] == interaction_id
        ]

    @staticmethod
    def create(interaction_id: str, sender_id: str, body: str) -> Dict[str, Any]:
        clean_body = body.strip()[:1500]
        supabase = get_supabase()
        if supabase:
            try:
                res = (
                    supabase.table("messages")
                    .insert(
                        {
                            "interaction_id": interaction_id,
                            "sender_id": sender_id,
                            "body": clean_body,
                            "delivery_state": "sent",
                        }
                    )
                    .execute()
                )
                if res.data and isinstance(res.data, list) and len(res.data) > 0:
                    first_row = cast(Dict[str, Any], res.data[0])
                    return {
                        "id": str(first_row["id"]),
                        "body": str(first_row["body"]),
                        "sentByMe": True,
                        "deliveryState": str(first_row.get("delivery_state") or "sent"),
                        "createdAt": first_row.get("created_at"),
                    }
            except Exception:
                pass

        msg = {
            "id": f"msg-{int(time.time() * 1000)}",
            "interactionId": interaction_id,
            "senderId": sender_id,
            "body": clean_body,
            "deliveryState": "sent",
            "createdAt": now_iso(),
        }
        MESSAGES.append(msg)
        return {
            "id": msg["id"],
            "body": msg["body"],
            "sentByMe": True,
            "deliveryState": "sent",
            "createdAt": msg["createdAt"],
        }
