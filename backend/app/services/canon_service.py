"""
M2 — Gestión de los 6 estados del canon.

Toda transición de estado genera un evento en canon_eventos (audit trail).
El agente nunca puede promover a 'canon' solo — solo el autor puede.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.nodo_grafo import NodoGrafo
from app.models.arista_grafo import AristaGrafo
from app.models.canon_evento import CanonEvento


async def cambiar_estado(
    session: AsyncSession,
    manuscrito_id: int,
    entidad_tipo: str,
    entidad_id: int,
    nuevo_estado: str,
    realizado_por: str,  # "ia" | "autor"
    usuario_id: int | None = None,
    nota: str | None = None,
) -> None:
    """
    Cambia el estado de un nodo o arista y registra el evento en el audit trail.
    """
    entidad = await _obtener_entidad(session, entidad_tipo, entidad_id)
    if not entidad:
        raise ValueError(f"{entidad_tipo} {entidad_id} no encontrado")

    estado_anterior = entidad.estado
    entidad.estado = nuevo_estado

    evento = CanonEvento(
        manuscrito_id=manuscrito_id,
        tipo_evento=_inferir_tipo_evento(estado_anterior, nuevo_estado, realizado_por),
        entidad_tipo=entidad_tipo,
        entidad_id=entidad_id,
        estado_anterior=estado_anterior,
        estado_nuevo=nuevo_estado,
        descripcion=nota,
        realizado_por=realizado_por,
        usuario_id=usuario_id,
    )
    session.add(evento)


async def obtener_suggestions_pendientes(
    session: AsyncSession, manuscrito_id: int
) -> dict[str, list]:
    """Retorna todos los nodos y aristas en estado 'suggestion' para revisión del autor."""
    nodos = (await session.execute(
        select(NodoGrafo)
        .where(NodoGrafo.manuscrito_id == manuscrito_id)
        .where(NodoGrafo.estado == "suggestion")
        .order_by(NodoGrafo.created_at.desc())
    )).scalars().all()

    aristas = (await session.execute(
        select(AristaGrafo)
        .where(AristaGrafo.manuscrito_id == manuscrito_id)
        .where(AristaGrafo.estado == "suggestion")
        .order_by(AristaGrafo.created_at.desc())
    )).scalars().all()

    return {"nodos": list(nodos), "aristas": list(aristas)}


async def obtener_contradicciones(
    session: AsyncSession, manuscrito_id: int
) -> dict[str, list]:
    """Retorna todos los elementos marcados como 'contradictory'."""
    nodos = (await session.execute(
        select(NodoGrafo)
        .where(NodoGrafo.manuscrito_id == manuscrito_id)
        .where(NodoGrafo.estado == "contradictory")
    )).scalars().all()

    aristas = (await session.execute(
        select(AristaGrafo)
        .where(AristaGrafo.manuscrito_id == manuscrito_id)
        .where(AristaGrafo.estado == "contradictory")
    )).scalars().all()

    return {"nodos": list(nodos), "aristas": list(aristas)}


async def _obtener_entidad(session, tipo, id):
    if tipo == "nodo":
        return await session.get(NodoGrafo, id)
    elif tipo == "arista":
        return await session.get(AristaGrafo, id)
    return None


def _inferir_tipo_evento(anterior, nuevo, realizado_por):
    if realizado_por == "ia":
        return "extraccion_ia"
    if nuevo == "canon":
        return "confirmacion_autor"
    if nuevo == "superseded":
        return "supersesion"
    if nuevo == "contradictory":
        return "marcado_contradictorio"
    if anterior == "suggestion" and nuevo != "canon":
        return "rechazo_autor"
    return "correccion"
