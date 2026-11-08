import time
from typing import Any, Dict, List, cast
from app.core.database import get_supabase
from app.repositories.seed_store import REVIEWS, now_iso


class ReviewRepository:
    @staticmethod
    def list_all(limit: int = 50) -> List[Dict[str, Any]]:
        supabase = get_supabase()
        if supabase:
            try:
                res = (
                    supabase.table("reviews")
                    .select("*")
                    .order("created_at", desc=True)
                    .limit(limit)
                    .execute()
                )
                if res.data and isinstance(res.data, list):
                    return cast(List[Dict[str, Any]], res.data)
            except Exception:
                pass
        return REVIEWS

    @staticmethod
    def create(interaction_id: str, stars: int, comment: str) -> Dict[str, Any]:
        clean_comment = comment.strip()[:600]
        supabase = get_supabase()
        if supabase:
            try:
                res = (
                    supabase.table("reviews")
                    .insert(
                        {
                            "interaction_id": interaction_id,
                            "stars": stars,
                            "comment": clean_comment,
                        }
                    )
                    .execute()
                )
                if res.data and isinstance(res.data, list) and len(res.data) > 0:
                    first_row = cast(Dict[str, Any], res.data[0])
                    return {
                        "id": str(first_row["id"]),
                        "interactionId": str(first_row["interaction_id"]),
                        "stars": first_row["stars"],
                        "comment": first_row["comment"],
                        "createdAt": first_row.get("created_at"),
                    }
            except Exception:
                pass

        rev = {
            "id": f"rev-{int(time.time() * 1000)}",
            "interactionId": interaction_id,
            "stars": stars,
            "comment": clean_comment,
            "createdAt": now_iso(),
        }
        REVIEWS.append(rev)
        return rev
