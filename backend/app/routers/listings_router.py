from typing import Optional
from fastapi import APIRouter, Cookie, Header, Request
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.security import resolve_current_user
from app.repositories.listing_repository import ListingRepository

router = APIRouter(prefix="/api/app/listings", tags=["1. Listings (Publicaciones)"])


@router.get("")
def get_listings():
    return {"listings": ListingRepository.list_all()}


@router.post("")
async def create_listing(
    request: Request,
    app_session: Optional[str] = Cookie(default=None, alias=settings.SESSION_COOKIE),
    x_user_id: Optional[str] = Header(default=None, alias="X-User-Id"),
):
    user = resolve_current_user(app_session, x_user_id, fallback_default=True)
    user_zone = (user.get("zoneName") if user else None) or "Centro Cívico"
    user_name = (user.get("displayName") if user else None) or "Vecino de la zona"

    content_type = request.headers.get("content-type", "")
    if "multipart/form-data" in content_type:
        form = await request.form()
        kind = str(form.get("kind") or "service").strip()[:20]
        title = str(form.get("title") or "").strip()[:120]
        description = str(form.get("description") or "").strip()[:1200]
        category = str(form.get("category") or "Hogar").strip()[:80]
        price_label = str(form.get("priceLabel") or "").strip()[:80]
        zone_name = str(form.get("zoneName") or user_zone).strip()[:80]
        accepts_barter = str(form.get("acceptsBarter") or "").lower() in ("true", "on", "1")
    else:
        body = await request.json()
        kind = str(body.get("kind") or "service").strip()[:20]
        title = str(body.get("title") or "").strip()[:120]
        description = str(body.get("description") or "").strip()[:1200]
        category = str(body.get("category") or "Hogar").strip()[:80]
        price_label = str(body.get("priceLabel") or "").strip()[:80]
        zone_name = str(body.get("zoneName") or user_zone).strip()[:80]
        accepts_barter = bool(body.get("acceptsBarter"))

    if len(title) < 4 or len(description) < 12 or not category:
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "VALIDATION",
                    "message": "Revisa modalidad, título, descripción y categoría.",
                }
            },
        )

    new_listing = ListingRepository.create(
        title=title,
        description=description,
        kind=kind,
        category=category,
        price_label=price_label,
        zone_name=zone_name,
        accepts_barter=accepts_barter,
        display_name=user_name,
    )
    return JSONResponse(status_code=201, content={"listing": new_listing})
