import time
from typing import Any, Dict, List, cast
from app.core.database import get_supabase
from app.repositories.seed_store import EMERGENCY_BOARD, now_iso


class EmergencyRepository:
    @staticmethod
    def list_items(limit: int = 30) -> List[Dict[str, Any]]:
        supabase = get_supabase()
        if supabase:
            try:
                res = (
                    supabase.table("emergency_board")
                    .select("*")
                    .order("created_at", desc=True)
                    .limit(limit)
                    .execute()
                )
                if res.data and isinstance(res.data, list):
                    return cast(List[Dict[str, Any]], res.data)
            except Exception:
                pass
        return EMERGENCY_BOARD

    @staticmethod
    def create_item(kind: str, title: str, zone_name: str, source: str) -> Dict[str, Any]:
        clean_title = title.strip()[:140]
        supabase = get_supabase()
        if supabase:
            try:
                res = (
                    supabase.table("emergency_board")
                    .insert(
                        {
                            "kind": kind,
                            "title": clean_title,
                            "zone_name": zone_name,
                            "source": source,
                            "verified": False,
                        }
                    )
                    .execute()
                )
                if res.data and isinstance(res.data, list) and len(res.data) > 0:
                    return cast(Dict[str, Any], res.data[0])
            except Exception:
                pass

        item = {
            "id": f"emg-{int(time.time() * 1000)}",
            "kind": kind,
            "title": clean_title,
            "zone_name": zone_name,
            "source": source,
            "verified": False,
            "created_at": now_iso(),
        }
        EMERGENCY_BOARD.insert(0, item)
        return item
