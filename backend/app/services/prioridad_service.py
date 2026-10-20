"""
M2 — Clasificación de context priority (S/A/B/C).

La prioridad determina qué contexto se incluye en los prompts de la IA.
Se calcula automáticamente con tres señales:
  1. Recencia (¿cuántos capítulos atrás apareció esta entidad?)
  2. Centralidad en el grafo (grado de conexiones)
  3. Override manual del autor

El autor puede fijar prioridad_override=True para bloquear el recalculo.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.nodo_grafo import NodoGrafo
from app.models.arista_grafo import AristaGrafo


async def recalcular_prioridades(
    session: AsyncSession,
    manuscrito_id: int,
    capitulo_actual: int,
) -> None:
    """
    Recalcula las prioridades de todos los nodos del manuscrito.
    Solo afecta nodos sin override manual (prioridad_override=False).
    Se llama después de cada capítulo procesado.
    """
    nodos = (await session.execute(
        select(NodoGrafo)
        .where(NodoGrafo.manuscrito_id == manuscrito_id)
        .where(NodoGrafo.prioridad_override == False)
        .where(NodoGrafo.estado.in_(["canon", "suggestion"]))
    )).scalars().all()

    grados = await _calcular_grados(session, manuscrito_id)

    for nodo in nodos:
        prioridad = _calcular_prioridad(
            ultimo_cap=nodo.ultimo_cap_aparicion or 0,
            cap_actual=capitulo_actual,
            grado=grados.get(nodo.id, 0),
        )
        nodo.prioridad = prioridad


def _calcular_prioridad(ultimo_cap: int, cap_actual: int, grado: int) -> str:
    distancia = cap_actual - ultimo_cap

    # Base por recencia
    if distancia <= 3:
        prioridad_base = "S"
    elif distancia <= 10:
        prioridad_base = "A"
    elif distancia <= 30:
        prioridad_base = "B"
    else:
        prioridad_base = "C"

    # Ajuste por centralidad
    if grado >= 8 and prioridad_base in ("B", "C"):
        return _subir_prioridad(prioridad_base)
    if grado <= 1 and prioridad_base in ("S", "A"):
        return _bajar_prioridad(prioridad_base)

    return prioridad_base


def _subir_prioridad(p: str) -> str:
    return {"C": "B", "B": "A", "A": "A", "S": "S"}[p]


def _bajar_prioridad(p: str) -> str:
    return {"S": "A", "A": "B", "B": "C", "C": "C"}[p]


async def _calcular_grados(session: AsyncSession, manuscrito_id: int) -> dict[int, int]:
    """Cuenta el número de aristas activas por nodo (grado no dirigido)."""
    from sqlalchemy import or_, and_
    aristas = (await session.execute(
        select(AristaGrafo.nodo_origen_id, AristaGrafo.nodo_destino_id)
        .where(AristaGrafo.manuscrito_id == manuscrito_id)
        .where(AristaGrafo.estado.in_(["canon", "suggestion"]))
        .where(AristaGrafo.supersedida_por_id.is_(None))
    )).all()

    grados: dict[int, int] = {}
    for origen, destino in aristas:
        grados[origen]  = grados.get(origen, 0) + 1
        grados[destino] = grados.get(destino, 0) + 1
    return grados
