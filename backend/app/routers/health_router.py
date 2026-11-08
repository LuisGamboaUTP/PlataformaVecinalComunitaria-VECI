from fastapi import APIRouter
from app.core.database import get_supabase, is_supabase_configured

router = APIRouter(prefix="/api", tags=["Health Check"])


@router.get("/health")
def health_check():
    supabase = get_supabase()
    db_connected = False
    listings_count = 0
    db_error = None
    if supabase:
        try:
            res = supabase.table("listings").select("id", count="exact").limit(1).execute()
            db_connected = True
            listings_count = res.count if res.count is not None else len(res.data or [])
        except Exception as exc:
            db_error = str(exc)
    return {
        "status": "ok",
        "service": "nexobarrio-fastapi",
        "supabaseConfigured": is_supabase_configured(),
        "supabaseConnected": db_connected,
        "listingsCount": listings_count,
        "dbError": db_error,
    }
