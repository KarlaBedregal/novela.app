"""
M3 — Construcción de contexto para el agente de Q&A.

Combina context priority + texto real de capítulos + búsqueda semántica.
"""
import re
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.nodo_grafo import NodoGrafo
from app.models.arista_grafo import AristaGrafo
from app.models.capitulo import Capitulo
from app.services.embedding_service import buscar_similares


def _detectar_capitulo_mencionado(consulta: str) -> int | None:
    """Detecta si la consulta menciona un número de capítulo específico."""
    for patron in [r"cap[ií]tulo\s*(\d+)", r"\bcap\.?\s*(\d+)\b"]:
        m = re.search(patron, consulta.lower())
        if m:
            return int(m.group(1))
    return None


async def construir_contexto(
    session: AsyncSession,
    manuscrito_id: int,
    consulta: str,
    cap_actual: int,
    max_tokens_estimados: int = 1200,
    capitulo_forzado: int | None = None,
) -> dict:
    """
    Construye el contexto óptimo para responder una consulta.

    Retorna dict con:
      - nodos_alta_prioridad
      - aristas_activas
      - nodos_por_id
      - chunks_semanticos
      - capitulos_texto: texto real de capítulos relevantes
      - cap_actual
    """
    # 1. Nodos — primero S/A, fallback a todos si son menos de 3
    nodos_sa = (await session.execute(
        select(NodoGrafo).where(
            NodoGrafo.manuscrito_id == manuscrito_id,
            NodoGrafo.estado.in_(["canon", "suggestion"]),
            NodoGrafo.prioridad.in_(["S", "A"]),
        ).order_by(NodoGrafo.prioridad)
    )).scalars().all()

    if len(nodos_sa) < 3:
        nodos_sa = (await session.execute(
            select(NodoGrafo).where(
                NodoGrafo.manuscrito_id == manuscrito_id,
                NodoGrafo.estado.in_(["canon", "suggestion"]),
            ).order_by(NodoGrafo.prioridad).limit(40)
        )).scalars().all()

    # 2. Aristas canon activas — todas
    aristas_sa = (await session.execute(
        select(AristaGrafo).where(
            AristaGrafo.manuscrito_id == manuscrito_id,
            AristaGrafo.estado.in_(["canon"]),
            AristaGrafo.supersedida_por_id.is_(None),
        ).limit(60)
    )).scalars().all()

    # Resolver nombres de nodos en aristas sin lazy loading
    nodos_por_id: dict[int, NodoGrafo] = {n.id: n for n in nodos_sa}
    nodos_faltantes = set()
    for a in aristas_sa:
        if a.nodo_origen_id not in nodos_por_id:
            nodos_faltantes.add(a.nodo_origen_id)
        if a.nodo_destino_id not in nodos_por_id:
            nodos_faltantes.add(a.nodo_destino_id)
    if nodos_faltantes:
        extra = (await session.execute(
            select(NodoGrafo).where(NodoGrafo.id.in_(nodos_faltantes))
        )).scalars().all()
        for n in extra:
            nodos_por_id[n.id] = n

    # 3. Chunks semánticos de ChromaDB (Ollama puede no estar disponible)
    try:
        chunks = await buscar_similares(
            manuscrito_id=manuscrito_id,
            consulta=consulta,
            n_resultados=5,
            filtro_prioridad=["S", "A", "B"],
        )
    except Exception:
        chunks = []

    # 4. Texto real de capítulos
    capitulos_texto = []

    # Prioridad: capítulo forzado por el frontend > capítulo mencionado en la consulta > recientes
    cap_objetivo = capitulo_forzado or _detectar_capitulo_mencionado(consulta)

    if cap_objetivo:
        cap = (await session.execute(
            select(Capitulo).where(
                Capitulo.manuscrito_id == manuscrito_id,
                Capitulo.numero == cap_objetivo,
            )
        )).scalar_one_or_none()
        if cap and cap.texto_plano:
            capitulos_texto.append({
                "numero": cap.numero,
                "titulo": cap.titulo or f"Capítulo {cap.numero}",
                "texto": cap.texto_plano[:5000],
            })
    else:
        # Cargar los últimos 3 capítulos completados como contexto general
        caps_recientes = (await session.execute(
            select(Capitulo).where(
                Capitulo.manuscrito_id == manuscrito_id,
                Capitulo.estado_procesamiento == "completado",
            ).order_by(Capitulo.numero.desc()).limit(3)
        )).scalars().all()

        for cap in reversed(caps_recientes):
            if cap.texto_plano:
                capitulos_texto.append({
                    "numero": cap.numero,
                    "titulo": cap.titulo or f"Capítulo {cap.numero}",
                    "texto": cap.texto_plano[:2000],
                })

    return {
        "nodos_alta_prioridad": nodos_sa,
        "aristas_activas": aristas_sa,
        "nodos_por_id": nodos_por_id,
        "chunks_semanticos": chunks,
        "capitulos_texto": capitulos_texto,
        "cap_actual": cap_actual,
    }


def formatear_contexto_para_prompt(contexto: dict, mapa_anonimizacion: dict) -> str:
    """
    Convierte el contexto en texto plano para el prompt del agente.
    Incluye grafo de personajes Y texto real de capítulos.
    """
    nodos_por_id: dict = contexto.get("nodos_por_id", {})
    lineas = ["=== CONTEXTO DEL UNIVERSO (capítulo actual: " + str(contexto["cap_actual"]) + ") ==="]

    if contexto["nodos_alta_prioridad"]:
        lineas.append("\n== Personajes/entidades relevantes ==")
        for nodo in contexto["nodos_alta_prioridad"]:
            nombre = nodo.nombre_anonimizado or nodo.nombre
            desc   = nodo.descripcion or ""
            lineas.append(f"- {nombre} ({nodo.tipo}): {desc}")

    if contexto["aristas_activas"]:
        lineas.append("\n== Relaciones activas ==")
        for arista in contexto["aristas_activas"]:
            nodo_o = nodos_por_id.get(arista.nodo_origen_id)
            nodo_d = nodos_por_id.get(arista.nodo_destino_id)
            origen  = (nodo_o.nombre_anonimizado or nodo_o.nombre) if nodo_o else str(arista.nodo_origen_id)
            destino = (nodo_d.nombre_anonimizado or nodo_d.nombre) if nodo_d else str(arista.nodo_destino_id)
            lineas.append(f"- {origen} → {arista.tipo_relacion} → {destino}")

    if contexto.get("capitulos_texto"):
        lineas.append("\n== Texto de capítulos ==")
        for cap_data in contexto["capitulos_texto"]:
            lineas.append(f"\n--- {cap_data['titulo']} ---")
            lineas.append(cap_data["texto"])

    if contexto["chunks_semanticos"]:
        lineas.append("\n== Fragmentos adicionales relevantes ==")
        for chunk in contexto["chunks_semanticos"]:
            lineas.append(f'"{chunk["texto"][:300]}..."')

    return "\n".join(lineas)
