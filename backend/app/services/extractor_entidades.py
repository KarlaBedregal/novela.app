"""
M1 — Extracción de entidades para el grafo.

spaCy hace la detección inicial, el agente Gemini refina.
Cada entidad se crea con estado='suggestion' y su fuente_primera_mencion.
"""
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.nodo_grafo import NodoGrafo
from app.services.anonimizador import ResultadoAnonimizacion


async def extraer_y_guardar_nodos(
    session: AsyncSession,
    manuscrito_id: int,
    capitulo_id: int,
    capitulo_numero: int,
    texto_original: str,
    resultado_anon: ResultadoAnonimizacion,
) -> list[NodoGrafo]:
    """
    Crea los nodos del grafo a partir de las entidades detectadas por spaCy.
    Solo crea nodos nuevos — si el nodo ya existe (mismo nombre en este manuscrito),
    actualiza su ultimo_cap_aparicion.

    Todos los nodos nuevos entran con estado='suggestion'.
    Se guarda fuente_primera_mencion con el fragmento exacto del texto.
    """
    # Retorna TODOS los nodos tocados (nuevos + existentes) para que
    # _buscar_nodo_id_por_token funcione en re-runs donde los nodos ya existen.
    nodos_todos: list[NodoGrafo] = []
    vistos: set[str] = set()  # evitar duplicados por el mismo nombre en el texto

    for ent in resultado_anon.entidades_detectadas:
        nombre = ent["texto"]
        token  = ent["token"]
        tipo   = _mapear_tipo(ent["tipo"])

        if nombre in vistos:
            continue
        vistos.add(nombre)

        # Buscar si ya existe en este manuscrito
        nodo_existente = await _buscar_nodo_por_nombre(session, manuscrito_id, nombre)

        if nodo_existente:
            nodo_existente.ultimo_cap_aparicion = capitulo_numero
            # Actualizar token por si cambió en re-run
            nodo_existente.nombre_anonimizado = token
            nodos_todos.append(nodo_existente)
        else:
            # Extraer fragmento de contexto (±100 caracteres alrededor de la entidad)
            inicio = max(0, ent["inicio"] - 100)
            fin    = min(len(texto_original), ent["fin"] + 100)
            fragmento = texto_original[inicio:fin].strip()

            nodo = NodoGrafo(
                manuscrito_id=manuscrito_id,
                tipo=tipo,
                nombre=nombre,
                nombre_anonimizado=token,
                primer_cap_aparicion=capitulo_numero,
                ultimo_cap_aparicion=capitulo_numero,
                estado="suggestion",
                fuente_primera_mencion=fragmento,
                cap_fuente_id=capitulo_id,
                pos_inicio=ent["inicio"],
                pos_fin=ent["fin"],
                prioridad="B",
                updated_at=datetime.now(timezone.utc),
            )
            session.add(nodo)
            nodos_todos.append(nodo)

    await session.flush()
    return nodos_todos


def _mapear_tipo(label: str) -> str:
    return {
        "PER":  "personaje",
        "LOC":  "lugar",
        "ORG":  "lugar",
        "MISC": "objeto",
    }.get(label, "personaje")


async def _buscar_nodo_por_nombre(
    session: AsyncSession, manuscrito_id: int, nombre: str
) -> NodoGrafo | None:
    from sqlalchemy import select
    stmt = (
        select(NodoGrafo)
        .where(NodoGrafo.manuscrito_id == manuscrito_id)
        .where(NodoGrafo.nombre == nombre)
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()
