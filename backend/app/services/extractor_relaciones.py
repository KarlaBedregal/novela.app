"""
M1 — Extracción de relaciones entre entidades.

Estrategia:
  1. Gemini (con retry) analiza el texto anonimizado y extrae relaciones semánticas.
  2. Si Gemini falla (503 / no disponible), fallback local por co-ocurrencia en párrafo:
     dos entidades en ≤500 chars → arista "aparece_con".
"""
import json
import re
from itertools import combinations
from google import genai
from google.genai import types
from app.config import settings


_client = None


def _get_client():
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client


PROMPT_EXTRACCION = """
Eres un sistema de extracción de relaciones narrativas.
Analiza el siguiente fragmento de texto (los nombres están anonimizados) y extrae las relaciones entre entidades.

Texto:
{texto}

Entidades presentes:
{entidades}

Para cada relación que detectes, responde con un JSON array con este formato exacto:
[
  {{
    "origen": "[CHAR_A]",
    "destino": "[CHAR_B]",
    "tipo_relacion": "traiciono_a",
    "descripcion": "descripción breve de la relación",
    "fragmento": "fragmento exacto del texto que justifica esta relación"
  }}
]

Tipos de relación válidos: amigo_de, enemigo_de, hermano_de, padre_de, traiciono_a,
ama_a, trabaja_para, posee, descubrio, protege_a, vive_en, nacio_en, mato_a, aliadode, otro.

Si no detectas ninguna relación, responde con [].
Responde SOLO con el JSON, sin explicación adicional.
"""


async def extraer_relaciones_con_ia(
    texto_anonimizado: str,
    entidades: list[dict],
    mapa_anonimizacion: dict[str, str],
) -> list[dict]:
    """
    Llama a Gemini con el texto anonimizado y extrae relaciones.
    Retorna lista de relaciones con tokens anónimos.
    Lanza excepción si Gemini no responde — el llamador decide el fallback.
    """
    if len(entidades) < 2:
        return []

    client = _get_client()
    entidades_str = "\n".join(f"- {e['token']} = [nombre oculto] ({e['tipo']})" for e in entidades)

    prompt = PROMPT_EXTRACCION.format(
        texto=texto_anonimizado[:4000],
        entidades=entidades_str,
    )

    response = await _llamar_con_retry(client, prompt)

    try:
        texto_respuesta = response.text.strip()
        if texto_respuesta.startswith("```"):
            texto_respuesta = texto_respuesta.split("```")[1]
            if texto_respuesta.startswith("json"):
                texto_respuesta = texto_respuesta[4:]
        return json.loads(texto_respuesta)
    except (json.JSONDecodeError, IndexError):
        return []


async def _llamar_con_retry(client, prompt: str, intentos: int = 3):
    import asyncio
    delay = 5
    last_exc = None
    for i in range(intentos):
        try:
            return await asyncio.to_thread(
                client.models.generate_content,
                model="gemini-flash-latest",
                contents=prompt,
                config=types.GenerateContentConfig(
                    automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True)
                ),
            )
        except Exception as e:
            last_exc = e
            if i < intentos - 1:
                await asyncio.sleep(delay)
                delay *= 2
    raise last_exc


def extraer_relaciones_por_coocurrencia(
    texto: str,
    entidades: list[dict],
    mapa_anonimizacion: dict[str, str],
) -> list[dict]:
    """
    Fallback local cuando Gemini no está disponible.
    Detecta pares de entidades que co-ocurren en el mismo párrafo (≤500 chars de distancia)
    y crea aristas de tipo 'aparece_con'.

    Solo considera entidades de tipo PER para las relaciones (personajes), ya que
    las relaciones LOC/lugar no tienen semántica narrativa directa.
    """
    if len(entidades) < 2:
        return []

    # Solo usamos personajes para co-ocurrencia
    chars = [e for e in entidades if e.get("tipo") == "PER"]
    if len(chars) < 2:
        # Si no hay suficientes PER, usar todas las entidades
        chars = entidades

    # Dividir texto en párrafos (por líneas en blanco o cada ~500 chars)
    parrafos = re.split(r'\n\s*\n', texto)
    if len(parrafos) == 1:
        # Sin párrafos explícitos: ventanas deslizantes de 500 chars con 50% de solapamiento
        parrafos = []
        paso = 250
        ventana = 500
        for i in range(0, max(1, len(texto) - ventana + paso), paso):
            parrafos.append(texto[i:i + ventana])

    relaciones: list[dict] = []
    pares_vistos: set[tuple[str, str]] = set()

    for parrafo in parrafos:
        # Entidades que aparecen en este párrafo
        presentes = [e for e in chars if e["texto"] in parrafo or e["token"] in parrafo]
        if len(presentes) < 2:
            continue

        # Deduplicar por token antes de combinar (evita auto-pares [CHAR_A]→[CHAR_A])
        presentes_uniq = list({e["token"]: e for e in presentes}.values())
        if len(presentes_uniq) < 2:
            continue

        for e1, e2 in combinations(presentes_uniq, 2):
            par = (min(e1["token"], e2["token"]), max(e1["token"], e2["token"]))
            if par in pares_vistos:
                continue
            pares_vistos.add(par)

            # Fragmento contextual: texto entre las dos menciones (truncado)
            t1, t2 = e1["token"], e2["token"]
            fragmento = parrafo[:200].strip()

            relaciones.append({
                "origen":        e1["token"],
                "destino":       e2["token"],
                "tipo_relacion": "aparece_con",
                "descripcion":   f"{e1['texto']} y {e2['texto']} aparecen en la misma escena.",
                "fragmento":     fragmento,
            })

    return relaciones
