from pydantic import BaseModel


class MessageCreateInput(BaseModel):
    interactionId: str
    body: str

