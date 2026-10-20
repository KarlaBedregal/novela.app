"""
M2 — Gestión de supersesiones de relaciones.

Cuando una relación narrativa evoluciona (Elena deja de ser amiga de Rodrigo),
el autor crea la nueva relación y marca la vieja como superseded.
El campo supersedida_por_id las vincula para mostrar el timeline evolutivo.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.arista_grafo import AristaGrafo
from app.services.canon_service import cambiar_estado


async def aplicar_supersesion(
    session: AsyncSession,
    manuscrito_id: int,
    arista_antigua_id: int,
    arista_nueva_id: int,
    cap_inicio_nueva: int,
    usuario_id: int,
    nota: str | None = None,
) -> tuple[AristaGrafo, AristaGrafo]:
    """
    Marca arista_antigua como superseded y la linkea con arista_nueva.
    Establece cap_fin en la antigua y cap_inicio en la nueva.

    Retorna (arista_antigua actualizada, arista_nueva actualizada).
    """
    antigua = await session.get(AristaGrafo, arista_antigua_id)
    nueva   = await session.get(AristaGrafo, arista_nueva_id)

    if not antigua or not nueva:
        raise ValueError("Una o ambas aristas no existen")
    if antigua.manuscrito_id != manuscrito_id or nueva.manuscrito_id != manuscrito_id:
        raise ValueError("Las aristas no pertenecen a este manuscrito")

    # Cerrar la relación antigua
    antigua.cap_fin          = cap_inicio_nueva - 1
    antigua.supersedida_por_id = nueva.id

    # Establecer inicio de la nueva
    nueva.cap_inicio = cap_inicio_nueva

    # Cambiar estados con audit trail
    await cambiar_estado(
        session, manuscrito_id, "arista", arista_antigua_id,
        "superseded", "autor", usuario_id,
        nota=nota or f"Supersedida por arista {arista_nueva_id} desde capítulo {cap_inicio_nueva}"
    )
    await cambiar_estado(
        session, manuscrito_id, "arista", arista_nueva_id,
        "canon", "autor", usuario_id,
        nota=f"Supersede a arista {arista_antigua_id}"
    )

    return antigua, nueva


async def obtener_historial_relacion(
    session: AsyncSession, arista_id: int
) -> list[AristaGrafo]:
    """
    Retorna la cadena completa de supersesiones para una arista.
    Útil para mostrar el timeline evolutivo de una relación.
    """
    historial = []
    actual_id = arista_id

    # Buscar hacia atrás: ¿qué aristas fueron supersedidas por esta?
    from sqlalchemy import select
    while actual_id:
        arista = await session.get(AristaGrafo, actual_id)
        if not arista:
            break
        historial.append(arista)

        # Buscar la antecesora (que tiene supersedida_por_id = actual_id)
        antecesora = (await session.execute(
            select(AristaGrafo).where(AristaGrafo.supersedida_por_id == actual_id)
        )).scalar_one_or_none()

        actual_id = antecesora.id if antecesora else None

    return list(reversed(historial))  # cronológico
