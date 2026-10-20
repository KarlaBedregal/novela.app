"""
M2 — Detección de contradicciones entre capítulos.

Cuando se agrega una nueva arista (suggestion), se compara con el grafo existente.
Si dos aristas del mismo par de nodos dicen cosas incompatibles → contradictory.

Importante: una supersesión NO es una contradicción.
  - Contradicción: "Elena es amiga de Rodrigo" vs "Elena es enemiga de Rodrigo" (mismo período)
  - Supersesión: "Elena fue amiga [caps 1-10]" → "Elena es enemiga [caps 11+]" (períodos distintos)
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.arista_grafo import AristaGrafo

# Pares de relaciones que son mutuamente excluyentes
RELACIONES_OPUESTAS = {
    "amigo_de":   {"enemigo_de", "rival_de"},
    "enemigo_de": {"amigo_de", "aliadode"},
    "padre_de":   set(),  # no tiene opuesto directo, se detecta por estructura
    "vivo":       {"muerto"},
    "muerto":     {"vivo"},
}


async def detectar_contradicciones(
    session: AsyncSession,
    manuscrito_id: int,
    arista_nueva: AristaGrafo,
) -> list[AristaGrafo]:
    """
    Busca aristas canon/suggestion existentes entre los mismos nodos
    que contradigan la arista_nueva.

    Retorna lista de aristas en conflicto. El pipeline las marca como 'contradictory'.
    """
    aristas_existentes = (await session.execute(
        select(AristaGrafo).where(
            and_(
                AristaGrafo.manuscrito_id == manuscrito_id,
                AristaGrafo.id != arista_nueva.id,
                AristaGrafo.estado.in_(["canon", "suggestion"]),
                AristaGrafo.supersedida_por_id.is_(None),
                # Mismo par de nodos (cualquier dirección)
                (
                    (AristaGrafo.nodo_origen_id == arista_nueva.nodo_origen_id) &
                    (AristaGrafo.nodo_destino_id == arista_nueva.nodo_destino_id)
                ) | (
                    (AristaGrafo.nodo_origen_id == arista_nueva.nodo_destino_id) &
                    (AristaGrafo.nodo_destino_id == arista_nueva.nodo_origen_id)
                )
            )
        )
    )).scalars().all()

    contradicciones = []
    for existente in aristas_existentes:
        if _son_contradictorias(arista_nueva, existente):
            contradicciones.append(existente)

    return contradicciones


def _son_contradictorias(a1: AristaGrafo, a2: AristaGrafo) -> bool:
    """
    Dos aristas se contradicen si:
    1. Sus tipos de relación son opuestos, Y
    2. Sus rangos de capítulos se solapan (o uno de los dos no tiene rango definido).
    """
    opuestos_de_a1 = RELACIONES_OPUESTAS.get(a1.tipo_relacion, set())
    if a2.tipo_relacion not in opuestos_de_a1:
        return False

    # Si una no tiene rango, asumimos solapamiento (caso más conservador)
    if not a1.cap_inicio or not a2.cap_inicio:
        return True

    # Verificar solapamiento de rangos
    fin1 = a1.cap_fin or 99999
    fin2 = a2.cap_fin or 99999
    return not (fin1 < a2.cap_inicio or fin2 < a1.cap_inicio)
