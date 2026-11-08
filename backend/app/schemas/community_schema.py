from typing import Optional
from pydantic import BaseModel


class CommunityPostInput(BaseModel):
    circleName: str = "Centro Cívico"
    authorName: str = "Vecino de la zona"
    authorInitials: Optional[str] = None
    body: str
    hasSharedListing: Optional[bool] = False

