from pydantic import BaseModel


class EmergencyBoardInput(BaseModel):
    kind: str = "Necesidad"
    title: str
    zoneName: str = "Centro Cívico"
    source: str = "Vecino de la zona"

