"""
Agente corrector: valida correcciones del autor contra el texto real.

Cuando el autor dice "Elena y Rodrigo son hermanos, no amigos",
el agente busca la evidencia en el texto antes de aplicar el cambio.

Casos:
  A — La corrección está en el texto → aplicar
  B — No está en el texto → preguntar en qué capítulo, ofrecer como 'canon del autor'
  C — El texto dice lo contrario → alertar al autor antes de aplicar
"""
import json
from groq import Groq
from app.config import settings


MODEL = "openai/gpt-oss-120b"

PROMPT_VALIDACION = """Eres un asistente para escritores de novelas. Analiza si el texto confirma, contradice o no menciona la relación que describe el autor.

El autor afirma: "{descripcion_correccion}"

Texto del capítulo {numero_capitulo} (los nombres están anonimizados):
---
{texto_capitulo}
---

Responde SOLO con JSON válido, sin texto adicional:
{{
  "resultado": "confirmada",
  "fragmento_evidencia": "fragmento exacto del texto que lo prueba, o null si no hay",
  "explicacion": "explicación breve en español"
}}

Valores posibles para "resultado": "confirmada", "contradice", "no_encontrada"
"""


class GeminiNoDisponible(Exception):
    """Error de IA (nombre mantenido por compatibilidad con grafo.py)."""


async def validar_correccion(
    descripcion: str,
    texto_capitulo_anonimizado: str,
    numero_capitulo: int,
    mapa_anonimizacion: dict,
) -> dict:
    """
    Valida si la corrección del autor está respaldada por el texto.
    Lanza GeminiNoDisponible si Groq no está disponible o no está configurado.
    """
    if not settings.GROQ_API_KEY:
        raise GeminiNoDisponible(
            "Groq no configurado. Agrega GROQ_API_KEY en el .env del backend."
        )

    desc_anonimizada = _anonimizar_descripcion(descripcion, mapa_anonimizacion)

    prompt = PROMPT_VALIDACION.format(
        descripcion_correccion=desc_anonimizada,
        numero_capitulo=numero_capitulo,
        texto_capitulo=texto_capitulo_anonimizado[:4000],
    )

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=512,
        )
        texto = response.choices[0].message.content or ""
        return json.loads(_limpiar_json(texto))
    except json.JSONDecodeError:
        return {
            "resultado": "no_encontrada",
            "fragmento_evidencia": None,
            "explicacion": "No se pudo interpretar la respuesta del modelo.",
        }
    except Exception as e:
        raise GeminiNoDisponible(f"Groq no disponible: {e}") from e


def _anonimizar_descripcion(descripcion: str, mapa: dict) -> str:
    """Reemplaza nombres reales por tokens en la descripción del autor."""
    mapa_inverso = {v: k for k, v in mapa.items()}
    resultado = descripcion
    for nombre, token in sorted(mapa_inverso.items(), key=lambda x: -len(x[0])):
        resultado = resultado.replace(nombre, token)
    return resultado


def _limpiar_json(texto: str) -> str:
    texto = texto.strip()
    if texto.startswith("```"):
        partes = texto.split("```")
        texto = partes[1] if len(partes) > 1 else texto
        if texto.startswith("json"):
            texto = texto[4:]
    return texto.strip()
