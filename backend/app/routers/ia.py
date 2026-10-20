from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.manuscrito import Manuscrito
from app.models.lector_progreso import LectorProgreso
from app.models.usuario import Usuario
from app.core.dependencies import get_current_user

router = APIRouter()


class PreguntaRequest(BaseModel):
    manuscrito_id:   int
    pregunta:        str
    modo:            str = "escritor"   # "escritor" | "lector"
    capitulo_numero: int | None = None  # capítulo activo en el frontend (opcional)


class PreguntaResponse(BaseModel):
    respuesta:      str
    contexto_usado: dict | None = None


@router.post("/preguntar", response_model=PreguntaResponse)
async def preguntar(
    datos: PreguntaRequest,
    usuario: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    El escritor o el lector hace una pregunta sobre el universo narrativo.
    Usa context priority (nodos S/A) + búsqueda semántica (ChromaDB) para construir el contexto.
    """
    manuscrito = await session.get(Manuscrito, datos.manuscrito_id)
    if not manuscrito:
        raise HTTPException(status_code=404, detail="Manuscrito no encontrado")

    # Determinar capítulo máximo permitido según el rol
    if datos.modo == "lector":
        progreso = (await session.execute(
            select(LectorProgreso).where(
                LectorProgreso.usuario_id == usuario.id,
                LectorProgreso.manuscrito_id == datos.manuscrito_id,
            )
        )).scalar_one_or_none()
        cap_actual = progreso.ultimo_capitulo_leido or 1 if progreso else 1
    else:
        if manuscrito.usuario_id != usuario.id:
            raise HTTPException(status_code=403, detail="No autorizado")
        cap_actual = 9999

    from app.services.contexto_service import construir_contexto
    from app.agents.agente_qa import responder_pregunta

    # El pipeline usa Groq con nombres reales, no hay mapa de anonimización activo
    contexto = await construir_contexto(
        session, datos.manuscrito_id, datos.pregunta, cap_actual,
        capitulo_forzado=datos.capitulo_numero,
    )

    respuesta = await responder_pregunta(
        pregunta=datos.pregunta,
        contexto=contexto,
        mapa_anonimizacion={},
        modo=datos.modo,
    )

    return PreguntaResponse(respuesta=respuesta)
