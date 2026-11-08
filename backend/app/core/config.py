import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env", override=True)
load_dotenv(BASE_DIR.parent / ".env.local", override=False)


class Settings:
    PROJECT_NAME: str = "VECI API (FastAPI + Supabase)"
    PROJECT_DESCRIPTION: str = (
        "Arquitectura en capas para VECI — Reto Hackatón UTP + El Comercio (Grupo 22 - Innovatrux)"
    )
    VERSION: str = "1.0.0"

    SUPABASE_URL: str = (
        os.getenv("SUPABASE_URL")
        or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        or ""
    ).strip()

    SUPABASE_KEY: str = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_KEY")
        or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        or ""
    ).strip()

    PORT: int = int(os.getenv("PORT", "8000"))
    SESSION_COOKIE: str = "app-session"

    @property
    def cors_origins(self) -> List[str]:
        raw = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
        return [origin.strip() for origin in raw.split(",") if origin.strip()]


settings = Settings()

