from typing import Optional
from pydantic import BaseModel


class InteractionCreateInput(BaseModel):
    listingId: str
    listingTitle: Optional[str] = "Publicación vecinal"
    type: str
    details: str
    idempotencyKey: str


class InteractionActionInput(BaseModel):
    action: str

