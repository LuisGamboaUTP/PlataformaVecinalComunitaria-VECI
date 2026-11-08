from typing import Optional
from fastapi import APIRouter, Cookie, Header
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.security import resolve_current_user
from app.repositories.review_repository import ReviewRepository
from app.schemas.review_schema import ReviewCreateInput

router = APIRouter(prefix="/api/app/reviews", tags=["5. Reviews (Reseñas Verificadas)"])


@router.get("")
def get_reviews():
    return {"reviews": ReviewRepository.list_all()}


@router.post("")
def create_review(
    payload: ReviewCreateInput,
    app_session: Optional[str] = Cookie(default=None, alias=settings.SESSION_COOKIE),
    x_user_id: Optional[str] = Header(default=None, alias="X-User-Id"),
):
    resolve_current_user(app_session, x_user_id, fallback_default=True)
    review = ReviewRepository.create(
        interaction_id=payload.interactionId,
        stars=payload.stars,
        comment=payload.comment,
    )
    return JSONResponse(status_code=201, content={"review": review})
