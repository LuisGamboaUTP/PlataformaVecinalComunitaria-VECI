import re
from typing import Any, Dict, Optional
from fastapi import APIRouter, Cookie, Header, Response
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.security import resolve_current_user
from app.repositories.auth_repository import AuthRepository
from app.schemas.auth_schema import LoginInput, ProfilePatchInput, RegisterInput

router = APIRouter(prefix="/api/app/session", tags=["2. Session & Profiles (Auth)"])


@router.get("")
def get_session(
    app_session: Optional[str] = Cookie(default=None, alias=settings.SESSION_COOKIE),
    x_user_id: Optional[str] = Header(default=None, alias="X-User-Id"),
):
    user = resolve_current_user(app_session, x_user_id, fallback_default=False)
    if not user:
        return {"user": None}
    return {
        "user": {
            "id": str(user.get("id", "")),
            "email": user.get("email"),
            "displayName": user.get("displayName"),
            "zoneName": user.get("zoneName"),
            "bio": user.get("bio"),
            "verificationStatus": user.get("verificationStatus", "not-verified"),
            "docType": user.get("docType"),
            "docNumber": user.get("docNumber"),
        }
    }


@router.post("")
def login_session(payload: LoginInput, response: Response):
    email = payload.email.strip().lower()
    password = payload.password.strip()
    matched = AuthRepository.find_by_credentials(email, password)
    if not matched:
        return JSONResponse(
            status_code=401,
            content={"error": {"message": "No pudimos iniciar sesión. Revisa tus datos."}},
        )

    response.set_cookie(
        key=settings.SESSION_COOKIE,
        value=f"fastapi:{matched['id']}",
        httponly=True,
        samesite="lax",
        path="/",
        max_age=60 * 60 * 24 * 7,
    )
    return {
        "user": {
            "id": str(matched["id"]),
            "email": matched.get("email"),
            "displayName": matched["displayName"],
            "zoneName": matched["zoneName"],
            "verificationStatus": matched.get("verificationStatus", "verified"),
            "docType": matched.get("docType"),
            "docNumber": matched.get("docNumber"),
        }
    }


@router.put("")
def register_session(payload: RegisterInput, response: Response):
    display_name = payload.displayName.strip()[:80]
    zone_name = payload.zoneName.strip()[:80] or "Centro Cívico"
    email = payload.email.strip().lower()[:160]
    password = payload.password.strip()[:200]
    doc_type = (payload.docType or "").strip()[:10]
    doc_number = (payload.docNumber or "").strip()[:20]

    if not display_name or not email or len(password) < 8:
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "message": "Completa todos los campos y usa una contraseña de al menos 8 caracteres."
                }
            },
        )

    verification_status = "unverified"
    if doc_number:
        valid_dni = doc_type.upper() == "DNI" and bool(re.match(r"^\d{8}$", doc_number))
        valid_ce = doc_type.upper() == "CE" and bool(re.match(r"^[A-Za-z0-9]{9,16}$", doc_number))
        valid_pas = doc_type.upper() in ("PASAPORTE", "PAS") and len(doc_number) >= 6
        if not valid_dni and not valid_ce and not valid_pas:
            return JSONResponse(
                status_code=422,
                content={
                    "error": {
                        "message": "Documento inválido: usa 8 dígitos para DNI, 9-16 caracteres para Carnet de Extranjería o pasaporte válido."
                    }
                },
            )
        verification_status = "verified"

    new_user = AuthRepository.register_profile(
        email=email,
        password=password,
        display_name=display_name,
        zone_name=zone_name,
        doc_type=doc_type,
        doc_number=doc_number,
        verification_status=verification_status,
    )

    response.set_cookie(
        key=settings.SESSION_COOKIE,
        value=f"fastapi:{new_user['id']}",
        httponly=True,
        samesite="lax",
        path="/",
        max_age=60 * 60 * 24 * 7,
    )
    return JSONResponse(
        status_code=201,
        content={
            "user": {
                "id": new_user["id"],
                "displayName": display_name,
                "zoneName": zone_name,
                "verificationStatus": new_user["verificationStatus"],
            }
        },
    )


@router.patch("")
def update_profile(
    payload: ProfilePatchInput,
    app_session: Optional[str] = Cookie(default=None, alias=settings.SESSION_COOKIE),
    x_user_id: Optional[str] = Header(default=None, alias="X-User-Id"),
):
    current = resolve_current_user(app_session, x_user_id, fallback_default=True)
    user: Dict[str, Any] = current if current else {"id": "user-demo", "displayName": "Vecino", "zoneName": "Centro Cívico"}

    if payload.displayName and len(payload.displayName.strip()) >= 2:
        user["displayName"] = payload.displayName.strip()[:80]
    if payload.zoneName and len(payload.zoneName.strip()) >= 2:
        user["zoneName"] = payload.zoneName.strip()[:80]
    if payload.bio is not None:
        user["bio"] = payload.bio.strip()[:400]

    doc_type = None
    doc_number = None
    if payload.verifyDocument:
        doc_type = (payload.docType or "").strip()
        doc_number = (payload.docNumber or "").strip()
        valid_dni = doc_type == "DNI" and bool(re.match(r"^\d{8}$", doc_number))
        valid_ce = doc_type == "CE" and bool(re.match(r"^[A-Za-z0-9]{9,12}$", doc_number))
        if not valid_dni and not valid_ce:
            return JSONResponse(
                status_code=422,
                content={
                    "error": {
                        "message": "Ingresa un número válido: 8 dígitos para DNI o de 9 a 12 caracteres para Carnet de Extranjería."
                    }
                },
            )
        user["verificationStatus"] = "verified"

    updated_user = AuthRepository.update_profile(user, doc_type, doc_number)
    return {
        "user": {
            "id": str(updated_user.get("id", "")),
            "displayName": updated_user.get("displayName"),
            "zoneName": updated_user.get("zoneName"),
            "bio": updated_user.get("bio"),
            "verificationStatus": updated_user.get("verificationStatus", "not-verified"),
        }
    }


@router.delete("")
def logout_session(response: Response):
    response.delete_cookie(settings.SESSION_COOKIE, path="/")
    return {"success": True}
