from typing import Optional
from pydantic import BaseModel


class ListingCreateInput(BaseModel):
    kind: str
    title: str
    description: str
    category: str
    priceLabel: Optional[str] = None
    zoneName: Optional[str] = "Centro Cívico"
    acceptsBarter: Optional[bool] = False

