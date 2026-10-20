from pydantic import BaseModel
from typing import Literal, Optional
from datetime import datetime


EstadoCanon = Literal["suggestion", "canon", "draft", "ambiguous", "contradictory", "superseded"]
Prioridad   = Literal["S", "A", "B", "C"]
TipoNodo    = Literal["personaje", "lugar", "objeto", "evento"]


class NodoGrafoBase(BaseModel):
    tipo:        TipoNodo
    nombre:      str
    descripcion: Optional[str] = None
    metadatos:   Optional[dict] = None


class NodoGrafoCreate(NodoGrafoBase):
    manuscrito_id: int


class NodoGrafoOut(NodoGrafoBase):
    id:                     int
    manuscrito_id:          int
    nombre_anonimizado:     Optional[str]
    primer_cap_aparicion:   Optional[int]
    ultimo_cap_aparicion:   Optional[int]
    estado:                 EstadoCanon
    fuente_primera_mencion: Optional[str]
    prioridad:              Prioridad
    prioridad_override:     bool
    created_at:             datetime

    model_config = {"from_attributes": True}


class AristaGrafoBase(BaseModel):
    nodo_origen_id:  int
    nodo_destino_id: int
    tipo_relacion:   str
    descripcion:     Optional[str] = None
    cap_inicio:      Optional[int] = None
    cap_fin:         Optional[int] = None


class AristaGrafoCreate(AristaGrafoBase):
    manuscrito_id: int


class AristaGrafoOut(AristaGrafoBase):
    id:                 int
    manuscrito_id:      int
    estado:             EstadoCanon
    fuente_texto:       Optional[str]
    supersedida_por_id: Optional[int]
    prioridad:          Prioridad
    created_at:         datetime

    model_config = {"from_attributes": True}


class GrafoCompleto(BaseModel):
    """Respuesta del endpoint GET /grafo/{manuscrito_id}"""
    manuscrito_id: int
    nodos:   list[NodoGrafoOut]
    aristas: list[AristaGrafoOut]


class CorreccionRequest(BaseModel):
    """El escritor envía una corrección al agente."""
    manuscrito_id:     int
    descripcion:       str   # "Elena y Rodrigo son hermanos, no amigos"
    entidad_tipo:      Optional[str] = None    # nodo / arista
    entidad_id:        Optional[int] = None
    capitulo_referencia: Optional[int] = None  # "esto se revela en cap 7"


class CorreccionResponse(BaseModel):
    resultado: Literal["aplicada", "no_encontrada", "contradiccion", "pendiente"]
    mensaje:   str
    cambios:   Optional[list[dict]] = None
