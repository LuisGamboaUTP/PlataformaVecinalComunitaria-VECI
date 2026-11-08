import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

_backend_dir = str(Path(__file__).resolve().parent.parent)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from app.core.config import settings
from app.routers import (
    community_router,
    emergency_router,
    health_router,
    interactions_router,
    listings_router,
    messages_router,
    notifications_router,
    reviews_router,
    session_router,
)


def create_application() -> FastAPI:
    application = FastAPI(
        title=settings.PROJECT_NAME,
        description=settings.PROJECT_DESCRIPTION,
        version=settings.VERSION,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(health_router)
    application.include_router(listings_router)
    application.include_router(session_router)
    application.include_router(interactions_router)
    application.include_router(messages_router)
    application.include_router(reviews_router)
    application.include_router(notifications_router)
    application.include_router(community_router)
    application.include_router(emergency_router)

    return application


app = create_application()
