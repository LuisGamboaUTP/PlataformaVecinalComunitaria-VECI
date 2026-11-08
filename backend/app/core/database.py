from typing import Optional
from app.core.config import settings

_supabase_client = None


def is_supabase_configured() -> bool:
    return bool(
        settings.SUPABASE_URL
        and settings.SUPABASE_KEY
        and settings.SUPABASE_URL.startswith("http")
        and "tu-proyecto.supabase.co" not in settings.SUPABASE_URL
    )


def get_supabase():
    """Singleton del cliente de Supabase con respaldo seguro si no hay red."""
    global _supabase_client
    if not is_supabase_configured():
        return None
    if _supabase_client is None:
        try:
            from supabase import create_client

            _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        except Exception:
            return None
    return _supabase_client
