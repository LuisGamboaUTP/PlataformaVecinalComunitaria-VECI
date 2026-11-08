from pydantic import BaseModel, Field


class ReviewCreateInput(BaseModel):
    interactionId: str
    stars: int = Field(..., ge=1, le=5)
    comment: str

