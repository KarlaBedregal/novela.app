from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CapituloCreate(BaseModel):
    numero:  int
    titulo:  Optional[str] = None
    texto:   str


class CapituloUpdate(BaseModel):
    titulo:       Optional[str]  = None
    texto:        Optional[str]  = None
    acceso_libre: Optional[bool] = None


class CapituloOut(BaseModel):
    id:                   int
    manuscrito_id:        int
    numero:               int
    titulo:               Optional[str]
    texto_plano:          Optional[str] = None
    version_actual:       int
    total_palabras:       Optional[int]
    estado_procesamiento: str
    acceso_libre:         bool
    created_at:           datetime
    updated_at:           Optional[datetime]

    model_config = {"from_attributes": True}


class ProcesarCapituloResponse(BaseModel):
    capitulo_id:     int
    task_id:         str   # ID de la tarea Celery
    mensaje:         str
