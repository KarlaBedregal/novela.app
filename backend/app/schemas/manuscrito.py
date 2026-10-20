from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ManuscritoCreate(BaseModel):
    titulo:          str
    genero:          Optional[str] = None
    nivel_contenido: str = "general"
    sinopsis:        Optional[str] = None


class ManuscritoUpdate(BaseModel):
    titulo:                  Optional[str] = None
    sinopsis:                Optional[str] = None
    nivel_contenido:         Optional[str] = None
    configuracion_inmersiva: Optional[dict] = None


class ManuscritoOut(BaseModel):
    id:              int
    usuario_id:      int
    titulo:          str
    genero:          Optional[str]
    nivel_contenido: str
    estado:          str
    encriptado:      bool
    publicado:       bool
    sinopsis:        Optional[str]
    portada_url:     Optional[str]
    created_at:      datetime
    updated_at:      Optional[datetime]

    model_config = {"from_attributes": True}
