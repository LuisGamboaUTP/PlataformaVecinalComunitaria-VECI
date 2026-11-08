import time
from typing import Any, Dict, List, Optional, cast
from app.core.database import get_supabase
from app.repositories.seed_store import COMMUNITY_POSTS, now_iso


class CommunityRepository:
    @staticmethod
    def list_posts(circle: Optional[str] = None, limit: int = 30) -> List[Dict[str, Any]]:
        supabase = get_supabase()
        if supabase:
            try:
                query = (
                    supabase.table("community_posts")
                    .select("*")
                    .order("created_at", desc=True)
                    .limit(limit)
                )
                if circle:
                    query = query.eq("circle_name", circle)
                res = query.execute()
                if res.data and isinstance(res.data, list):
                    return cast(List[Dict[str, Any]], res.data)
            except Exception:
                pass

        return (
            [p for p in COMMUNITY_POSTS if p["circle_name"] == circle]
            if circle
            else COMMUNITY_POSTS
        )

    @staticmethod
    def create_post(
        circle_name: str,
        author_name: str,
        author_initials: Optional[str],
        body: str,
        has_shared_listing: bool,
    ) -> Dict[str, Any]:
        initials = (
            author_initials
            or "".join([p[0] for p in author_name.split()[:2]]).upper()
            or "VN"
        )
        clean_body = body.strip()[:1200]
        supabase = get_supabase()
        if supabase:
            try:
                res = (
                    supabase.table("community_posts")
                    .insert(
                        {
                            "circle_name": circle_name,
                            "author_name": author_name,
                            "author_initials": initials,
                            "body": clean_body,
                            "has_shared_listing": has_shared_listing,
                        }
                    )
                    .execute()
                )
                if res.data and isinstance(res.data, list) and len(res.data) > 0:
                    return cast(Dict[str, Any], res.data[0])
            except Exception:
                pass

        post = {
            "id": f"post-{int(time.time() * 1000)}",
            "circle_name": circle_name,
            "author_name": author_name,
            "author_initials": initials,
            "body": clean_body,
            "has_shared_listing": has_shared_listing,
            "comments": [],
            "created_at": now_iso(),
        }
        COMMUNITY_POSTS.insert(0, post)
        return post
