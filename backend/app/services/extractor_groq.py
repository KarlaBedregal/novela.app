"""
Extracción unificada de entidades y relaciones con Groq (Llama 3.1 70B).
Reemplaza spaCy + Gemini en un solo paso.
"""
import json
import asyncio
from dataclasses import dataclass, field
from app.config import settings

_client = None
MODEL = "openai/gpt-oss-120b"

PROMPT_EXTRACCION = """Eres un sistema de análisis narrativo para novelas en español.

Analiza el siguiente fragmento y extrae ÚNICAMENTE:

1. ENTIDADES con nombre propio específico:
   - personaje: personas con nombre ("Elena", "Rodrigo", "Darian")
   - lugar: lugares con nombre propio ("Castillo Negro", "Valdoria", "La Torre del Norte")
   - objeto: objetos con nombre propio ("La Espada de Luz", "El Orbe Oscuro")

   NO incluir: pronombres (él, ella, yo), artículos solos, sustantivos genéricos
   (ventana, vagón, puerta, mesa, tren, casa, habitación, bosque, río, etc.)

2. RELACIONES con evidencia textual directa entre las entidades listadas:
   Tipos: amigo_de, enemigo_de, hermano_de, padre_de, hijo_de, ama_a,
          traiciono_a, trabaja_para, posee, descubrio, protege_a,
          vive_en, nacio_en, mato_a, aliado_de, conoce_a, otro

Texto:
{texto}

Responde SOLO con JSON válido sin ningún texto adicional:
{{
  "entidades": [
    {{"nombre": "Elena", "tipo": "personaje"}},
    {{"nombre": "Castillo Negro", "tipo": "lugar"}}
  ],
  "relaciones": [
    {{
      "origen": "Elena",
      "destino": "Castillo Negro",
      "tipo": "vive_en",
      "descripcion": "Elena vive en el Castillo Negro",
      "fragmento": "fragmento exacto del texto que lo prueba"
    }}
  ]
}}"""


@dataclass
class ResultadoExtraccion:
    entidades: list[dict] = field(default_factory=list)   # [{nombre, tipo}]
    relaciones: list[dict] = field(default_factory=list)  # [{origen, destino, tipo, descripcion, fragmento}]


def _get_client():
    global _client
    if _client is None:
        from groq import Groq
        _client = Groq(api_key=settings.GROQ_API_KEY)
    return _client


async def extraer_entidades_y_relaciones(texto: str) -> ResultadoExtraccion:
    """Un solo paso: extrae entidades Y relaciones del texto narrativo con Groq."""
    if not settings.GROQ_API_KEY:
        return ResultadoExtraccion()

    client = _get_client()
    prompt = PROMPT_EXTRACCION.format(texto=texto[:6000])

    try:
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=4096,
        )
        texto_respuesta = response.choices[0].message.content.strip()
        # Limpiar markdown si el modelo lo devuelve
        if "```" in texto_respuesta:
            partes = texto_respuesta.split("```")
            for parte in partes:
                if parte.startswith("json"):
                    texto_respuesta = parte[4:].strip()
                    break
                elif "{" in parte:
                    texto_respuesta = parte.strip()
                    break
        data = json.loads(texto_respuesta)
        return ResultadoExtraccion(
            entidades=data.get("entidades", []),
            relaciones=data.get("relaciones", []),
        )
    except Exception as e:
        print(f"[Groq] Error en extracción: {e}")
        return ResultadoExtraccion()
