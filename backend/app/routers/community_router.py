from typing import Optional
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.repositories.community_repository import CommunityRepository
from app.schemas.community_schema import CommunityPostInput

router = APIRouter(
    prefix="/api/app/community", tags=["7. Community Posts (Círculos Vecinales)"]
)


@router.get("")
def get_community_posts(circle: Optional[str] = None):
    return {"posts": CommunityRepository.list_posts(circle=circle)}


@router.post("")
def create_community_post(payload: CommunityPostInput):
    post = CommunityRepository.create_post(
        circle_name=payload.circleName,
        author_name=payload.authorName,
        author_initials=payload.authorInitials,
        body=payload.body,
        has_shared_listing=bool(payload.hasSharedListing),
    )
    return JSONResponse(status_code=201, content={"post": post})
