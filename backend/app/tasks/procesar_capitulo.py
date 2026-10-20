"""
Tarea Celery principal del M1: orquesta el pipeline completo de un capítulo.

Pasos:
  1. Detectar si es re-proceso (capítulo ya procesado que fue editado)
  2. Extraer entidades y relaciones con Groq — un solo paso
  3. Si es re-proceso: limpiar aristas del capítulo anterior y nodos huérfanos
  4. Guardar nodos y aristas en la DB (estado=canon)
  5. Calcular diff semántico y actualizar VersionCapitulo
  6. Detectar contradicciones
  7. Clasificar prioridad S/A/B/C
  8. Generar embeddings (Ollama → ChromaDB)
"""
import asyncio
from datetime import datetime, timezone
from app.tasks.celery_app import celery
from app.database import AsyncSessionLocal


@celery.task(bind=True, name="procesar_capitulo")
def procesar_capitulo_task(self, capitulo_id: int, manuscrito_id: int):
    return asyncio.run(_pipeline_async(self, capitulo_id, manuscrito_id))


async def _pipeline_async(task, capitulo_id: int, manuscrito_id: int):
    from app.models.capitulo import Capitulo, VersionCapitulo
    from app.models.nodo_grafo import NodoGrafo
    from app.models.arista_grafo import AristaGrafo
    from app.services.extractor_groq import extraer_entidades_y_relaciones
    from app.services.embedding_service import generar_y_guardar_embeddings
    from app.services.prioridad_service import recalcular_prioridades
    from app.services.contradiccion_service import detectar_contradicciones
    from app.services.canon_service import cambiar_estado
    from sqlalchemy import select, delete

    async with AsyncSessionLocal() as session:
        capitulo = await session.get(Capitulo, capitulo_id)
        if not capitulo:
            return {"error": "capítulo no encontrado"}

        capitulo.estado_procesamiento = "procesando"
        await session.commit()

        try:
            # ── Detectar re-proceso ────────────────────────────────────────────
            aristas_previas = (await session.execute(
                select(AristaGrafo).where(
                    AristaGrafo.manuscrito_id == manuscrito_id,
                    AristaGrafo.cap_fuente_id == capitulo_id,
                )
            )).scalars().all()
            es_reproceso = len(aristas_previas) > 0 or capitulo.version_actual > 1

            # Registrar nodos que pertenecen exclusivamente a este capítulo
            # (para detectar cuáles quedan huérfanos si Groq ya no los menciona)
            nodos_exclusivos_previos: set[str] = set()
            if es_reproceso:
                nodos_de_este_cap = (await session.execute(
                    select(NodoGrafo).where(
                        NodoGrafo.manuscrito_id == manuscrito_id,
                        NodoGrafo.primer_cap_aparicion == capitulo.numero,
                        NodoGrafo.ultimo_cap_aparicion == capitulo.numero,
                    )
                )).scalars().all()
                nodos_exclusivos_previos = {n.nombre.strip().lower() for n in nodos_de_este_cap}

            _notificar(task, capitulo_id, 15, "Extrayendo entidades y relaciones...")

            resultado = await extraer_entidades_y_relaciones(capitulo.texto_plano or "")

            _notificar(task, capitulo_id, 45, f"Guardando {len(resultado.entidades)} entidades...")

            now = datetime.now(timezone.utc)

            # ── Si es re-proceso: limpiar aristas anteriores de este capítulo ──
            aristas_eliminadas = 0
            if es_reproceso:
                aristas_eliminadas = len(aristas_previas)
                await session.execute(
                    delete(AristaGrafo).where(
                        AristaGrafo.manuscrito_id == manuscrito_id,
                        AristaGrafo.cap_fuente_id == capitulo_id,
                    )
                )
                await session.flush()

            # ── Pre-cargar TODOS los nodos del manuscrito para lookup completo ──
            todos_existentes = (await session.execute(
                select(NodoGrafo).where(NodoGrafo.manuscrito_id == manuscrito_id)
            )).scalars().all()

            nodo_por_nombre: dict[str, NodoGrafo] = {
                n.nombre.strip().lower(): n for n in todos_existentes
            }

            # ── Procesar entidades de Groq: crear nuevos, actualizar existentes ──
            nodos_nuevos = 0
            nombres_groq: set[str] = set()
            vistos: set[str] = set()

            for ent in resultado.entidades:
                nombre = ent.get("nombre", "").strip()
                tipo   = ent.get("tipo", "personaje")
                if not nombre or nombre.lower() in vistos:
                    continue
                vistos.add(nombre.lower())
                nombres_groq.add(nombre.lower())

                nodo_existente = nodo_por_nombre.get(nombre.strip().lower())

                if nodo_existente:
                    nodo_existente.ultimo_cap_aparicion = max(
                        nodo_existente.ultimo_cap_aparicion or 0,
                        capitulo.numero,
                    )
                else:
                    nodo = NodoGrafo(
                        manuscrito_id=manuscrito_id,
                        tipo=tipo,
                        nombre=nombre,
                        nombre_anonimizado=nombre,
                        primer_cap_aparicion=capitulo.numero,
                        ultimo_cap_aparicion=capitulo.numero,
                        estado="canon",
                        cap_fuente_id=capitulo_id,
                        prioridad="B",
                        updated_at=now,
                    )
                    session.add(nodo)
                    nodo_por_nombre[nombre.strip().lower()] = nodo
                    nodos_nuevos += 1

            await session.flush()

            # ── En re-proceso: marcar como 'rejected' nodos que ya no aparecen ─
            # Solo los que son exclusivos de este capítulo (no aparecen en otros)
            nodos_huerfanos = nodos_exclusivos_previos - nombres_groq
            if nodos_huerfanos:
                for nombre_lower in nodos_huerfanos:
                    nodo = nodo_por_nombre.get(nombre_lower)
                    if nodo:
                        nodo.estado = "rejected"

            # ── Guardar aristas — con deduplicación por capítulo ──────────────
            alertas_contradiccion = []
            relaciones_guardadas = 0

            for rel in resultado.relaciones:
                origen_nombre  = rel.get("origen", "").strip().lower()
                destino_nombre = rel.get("destino", "").strip().lower()
                nodo_origen  = nodo_por_nombre.get(origen_nombre)
                nodo_destino = nodo_por_nombre.get(destino_nombre)

                if not nodo_origen or not nodo_destino:
                    continue
                if nodo_origen.id is None or nodo_destino.id is None:
                    continue

                tipo_rel = rel.get("tipo", "otro")

                # Evitar duplicados exactos en el mismo capítulo
                dup = (await session.execute(
                    select(AristaGrafo).where(
                        AristaGrafo.manuscrito_id == manuscrito_id,
                        AristaGrafo.nodo_origen_id  == nodo_origen.id,
                        AristaGrafo.nodo_destino_id == nodo_destino.id,
                        AristaGrafo.tipo_relacion   == tipo_rel,
                        AristaGrafo.cap_inicio      == capitulo.numero,
                    )
                )).scalar_one_or_none()
                if dup:
                    continue

                arista = AristaGrafo(
                    manuscrito_id=manuscrito_id,
                    nodo_origen_id=nodo_origen.id,
                    nodo_destino_id=nodo_destino.id,
                    tipo_relacion=tipo_rel,
                    descripcion=rel.get("descripcion"),
                    fuente_texto=rel.get("fragmento"),
                    cap_fuente_id=capitulo_id,
                    cap_inicio=capitulo.numero,
                    estado="canon",
                    updated_at=now,
                )
                session.add(arista)
                relaciones_guardadas += 1
                await session.flush()

                contradicciones = await detectar_contradicciones(session, manuscrito_id, arista)
                for c in contradicciones:
                    await cambiar_estado(session, manuscrito_id, "arista", c.id, "contradictory", "ia")
                    alertas_contradiccion.append(c.id)

            # ── Actualizar diff semántico en la última VersionCapitulo ─────────
            if es_reproceso:
                entidades_agregadas = list(nombres_groq - nodos_exclusivos_previos)
                entidades_eliminadas = list(nodos_huerfanos)

                ultima_version = (await session.execute(
                    select(VersionCapitulo)
                    .where(VersionCapitulo.capitulo_id == capitulo_id)
                    .order_by(VersionCapitulo.numero_version.desc())
                    .limit(1)
                )).scalar_one_or_none()

                if ultima_version:
                    diff_base = ultima_version.diff or {}
                    ultima_version.diff = {
                        **diff_base,
                        "entidades_agregadas":  entidades_agregadas,
                        "entidades_eliminadas": entidades_eliminadas,
                        "relaciones_nuevas":    relaciones_guardadas,
                        "aristas_eliminadas":   aristas_eliminadas,
                        "version":              capitulo.version_actual,
                    }

            _notificar(task, capitulo_id, 75, "Clasificando prioridad...")
            await recalcular_prioridades(session, manuscrito_id, capitulo.numero)

            _notificar(task, capitulo_id, 85, "Generando embeddings...")
            try:
                await generar_y_guardar_embeddings(
                    manuscrito_id, capitulo_id,
                    capitulo.texto_plano or "",
                )
            except Exception:
                pass  # Ollama puede no estar disponible

            capitulo.estado_procesamiento = "completado"
            await session.commit()

            _notificar(task, capitulo_id, 100, "Completado", {
                "tipo":                   "reproceso" if es_reproceso else "nuevo",
                "nodos_nuevos":           nodos_nuevos,
                "relaciones_nuevas":      relaciones_guardadas,
                "alertas_contradiccion":  len(alertas_contradiccion),
                "aristas_eliminadas":     aristas_eliminadas,
            })

            return {
                "ok":               True,
                "tipo":             "reproceso" if es_reproceso else "nuevo",
                "nodos":            nodos_nuevos,
                "relaciones":       relaciones_guardadas,
                "aristas_eliminadas": aristas_eliminadas,
            }

        except Exception as exc:
            capitulo.estado_procesamiento = "error"
            await session.commit()
            raise exc


def _notificar(task, capitulo_id: int, progreso: int, mensaje: str, datos: dict = None):
    task.update_state(
        state="PROGRESS",
        meta={"capitulo_id": capitulo_id, "progreso": progreso, "mensaje": mensaje, **(datos or {})}
    )
