"""
Agente de extracción: recibe un capítulo anonimizado y extrae entidades + relaciones.
Refina lo que spaCy detectó y resuelve correferencias ("él" → "[CHAR_A]").
"""
import json
import asyncio
from google import genai
from google.genai import types
from app.config import settings


MODEL = "gemini-flash-latest"

SYSTEM_PROMPT = """
Eres un asistente especializado en análisis narrativo. Tu tarea es analizar fragmentos
de texto (con nombres anonimizados) e identificar entidades y relaciones narrativas.

Reglas:
1. Los nombres reales están reemplazados por tokens como [CHAR_A], [LOC_1], etc.
2. Trabaja SOLO con los tokens, nunca intentes adivinar los nombres reales.
3. Si ves "él", "ella", "el hombre" — trata de inferir a qué token corresponde por contexto.
4. Responde siempre en JSON válido.
"""


async def refinar_entidades(
    texto_anonimizado: str,
    entidades_spacy: list[dict],
) -> list[dict]:
    """
    Pasa el resultado de spaCy por Gemini para:
    - Resolver correferencias ("el anciano" → [CHAR_C])
    - Detectar entidades que spaCy perdió
    - Desambiguar tokens (¿[CHAR_A] y [CHAR_B] son la misma persona?)
    """
    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    prompt = f"""
Analiza este fragmento de texto y la lista de entidades detectadas.
Mejora la lista: resuelve correferencias, añade entidades faltantes.

TEXTO:
{texto_anonimizado[:3000]}

ENTIDADES DETECTADAS POR SPACY:
{json.dumps(entidades_spacy, ensure_ascii=False, indent=2)}

Responde con un JSON array con las entidades refinadas. Mismo formato:
[{{"token": "[CHAR_A]", "tipo": "PER", "menciones_adicionales": ["el anciano", "el maestro"]}}]
"""

    response = await _llamar_gemini(client, prompt)
    try:
        return json.loads(_limpiar_json(response.text))
    except (json.JSONDecodeError, AttributeError):
        return entidades_spacy  # fallback al resultado de spaCy


async def _llamar_gemini(client, prompt: str, max_intentos: int = 5):
    delay = 10
    for i in range(max_intentos):
        try:
            return await asyncio.to_thread(
                client.models.generate_content,
                model=MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
                ),
            )
        except Exception as e:
            if "503" in str(e) and i < max_intentos - 1:
                await asyncio.sleep(delay)
                delay *= 2
            else:
                raise


def _limpiar_json(texto: str) -> str:
    texto = texto.strip()
    if texto.startswith("```"):
        partes = texto.split("```")
        texto = partes[1]
        if texto.startswith("json"):
            texto = texto[4:]
    return texto.strip()
