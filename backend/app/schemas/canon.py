from pydantic import BaseModel
from typing import Literal, Optional
from datetime import datetime


class CanonEventoOut(BaseModel):
    id:              int
    manuscrito_id:   int
    tipo_evento:     str
    entidad_tipo:    str
    entidad_id:      int
    estado_anterior: Optional[str]
    estado_nuevo:    Optional[str]
    descripcion:     Optional[str]
    realizado_por:   str
    created_at:      datetime

    model_config = {"from_attributes": True}


class CambioEstadoRequest(BaseModel):
    """El autor aprueba, rechaza o cambia el estado de un nodo o arista."""
    entidad_tipo: Literal["nodo", "arista"]
    entidad_id:   int
    nuevo_estado: Literal["canon", "draft", "ambiguous", "contradictory", "superseded"]
    nota:         Optional[str] = None


class CambioPrioridadRequest(BaseModel):
    entidad_tipo: Literal["nodo", "arista"]
    entidad_id:   int
    prioridad:    Literal["S", "A", "B", "C"]


class SupersesionRequest(BaseModel):
    """Marca una arista como superseded y crea/linkea la nueva."""
    arista_antigua_id: int
    arista_nueva_id:   int   # debe existir ya como draft o suggestion
    cap_inicio_nueva:  int
    nota:              Optional[str] = None
