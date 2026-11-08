from typing import Optional
from pydantic import BaseModel


class LoginInput(BaseModel):
    email: str
    password: str


class RegisterInput(BaseModel):
    displayName: str
    zoneName: str = "Centro Cívico"
    email: str
    password: str
    docType: Optional[str] = None
    docNumber: Optional[str] = None


class ProfilePatchInput(BaseModel):
    displayName: Optional[str] = None
    zoneName: Optional[str] = None
    bio: Optional[str] = None
    verifyDocument: Optional[bool] = False
    docType: Optional[str] = None
    docNumber: Optional[str] = None

