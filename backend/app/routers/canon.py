from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.canon_evento import CanonEvento
from app.models.manuscrito import Manuscrito
from app.models.usuario import Usuario
from app.schemas.canon import (
    CanonEventoOut, CambioEstadoRequest, CambioPrioridadRequest, SupersesionRequest
)
from app.core.dependencies import get_current_user
from app.services.canon_service import cambiar_estado, obtener_suggestions_pendientes
from app.services.supersesion_service import aplicar_supersesion
from app.services.prioridad_service import recalcular_prioridades

router = APIRouter()


@router.get("/{manuscrito_id}/suggestions")
async def listar_suggestions(
    manuscrito_id: int,
    usuario: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Lista nodos y aristas en estado 'suggestion' pendientes de revisión del autor."""
    await _verificar_acceso(session, manuscrito_id, usuario.id)
    return await obtener_suggestions_pendientes(session, manuscrito_id)


@router.post("/{manuscrito_id}/estado")
async def cambiar_estado_entidad(
    manuscrito_id: int,
    datos: CambioEstadoRequest,
    usuario: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    await _verificar_acceso(session, manuscrito_id, usuario.id)
    await cambiar_estado(
        session, manuscrito_id,
        datos.entidad_tipo, datos.entidad_id,
        datos.nuevo_estado, "autor",
        usuario_id=usuario.id, nota=datos.nota,
    )
    await session.commit()
    return {"ok": True}


@router.post("/{manuscrito_id}/prioridad")
async def cambiar_prioridad(
    manuscrito_id: int,
    datos: CambioPrioridadRequest,
    usuario: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Override manual de prioridad. Fija prioridad_override=True."""
    await _verificar_acceso(session, manuscrito_id, usuario.id)

    if datos.entidad_tipo == "nodo":
        from app.models.nodo_grafo import NodoGrafo
        entidad = await session.get(NodoGrafo, datos.entidad_id)
    else:
        from app.models.arista_grafo import AristaGrafo
        entidad = await session.get(AristaGrafo, datos.entidad_id)

    if not entidad:
        raise HTTPException(status_code=404, detail="Entidad no encontrada")

    entidad.prioridad = datos.prioridad
    entidad.prioridad_override = True
    await session.commit()
    return {"ok": True, "prioridad": datos.prioridad}


@router.post("/{manuscrito_id}/supersesion")
async def crear_supersesion(
    manuscrito_id: int,
    datos: SupersesionRequest,
    usuario: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    await _verificar_acceso(session, manuscrito_id, usuario.id)
    antigua, nueva = await aplicar_supersesion(
        session, manuscrito_id,
        datos.arista_antigua_id, datos.arista_nueva_id,
        datos.cap_inicio_nueva, usuario.id, datos.nota,
    )
    await session.commit()
    return {"ok": True, "arista_supersedida": antigua.id, "nueva_arista": nueva.id}


@router.get("/{manuscrito_id}/eventos", response_model=list[CanonEventoOut])
async def historial_canon(
    manuscrito_id: int,
    limite: int = 50,
    usuario: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Audit trail completo — todas las decisiones tomadas sobre el grafo."""
    await _verificar_acceso(session, manuscrito_id, usuario.id)
    eventos = (await session.execute(
        select(CanonEvento)
        .where(CanonEvento.manuscrito_id == manuscrito_id)
        .order_by(CanonEvento.created_at.desc())
        .limit(limite)
    )).scalars().all()
    return eventos


async def _verificar_acceso(session, manuscrito_id: int, usuario_id: int):
    m = await session.get(Manuscrito, manuscrito_id)
    if not m or m.usuario_id != usuario_id:
        raise HTTPException(status_code=404, detail="Manuscrito no encontrado")
