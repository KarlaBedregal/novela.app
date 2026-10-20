"""
Agente Q&A: responde preguntas del escritor o del lector sobre el universo narrativo.
Tiene acceso al grafo de personajes Y al texto real de los capítulos.
"""
import asyncio
from groq import Groq
from app.config import settings
from app.services.contexto_service import formatear_contexto_para_prompt


MODEL = "openai/gpt-oss-120b"

SYSTEM_ESCRITOR = """Eres un asistente para escritores. Tienes acceso al grafo de personajes y al texto de los capítulos.

Reglas de respuesta:
- Sé DIRECTO y BREVE. Responde lo que se preguntó, nada más.
- Si preguntan por un personaje → di quién es en 1-2 frases.
- Si preguntan qué pasó → resume el evento en pocas líneas.
- Si preguntan por una relación → explícala en una línea.
- Solo da detalle completo si te lo piden explícitamente ("dame un resumen detallado", "explícame todo sobre...").
- Si la información no está en el contexto, dilo en una frase.
- Nada de introducciones, conclusiones ni relleno. Ve al grano.

Responde en español."""

SYSTEM_LECTOR = """Eres un asistente de lectura. Conoces la historia hasta donde el lector está.

- Responde SOLO con lo que el lector ya leyó (sin spoilers)
- Sé breve y directo. Si preguntan por un personaje o evento, responde en pocas líneas.
- Solo da más detalle si te lo piden.
- Responde en español."""


async def responder_pregunta(
    pregunta: str,
    contexto: dict,
    mapa_anonimizacion: dict,  # mantenido por compatibilidad, no se usa
    modo: str = "escritor",
) -> str:
    if not settings.GROQ_API_KEY:
        return "El servicio de chat no está disponible (GROQ_API_KEY no configurado)."

    contexto_texto = formatear_contexto_para_prompt(contexto, {})
    prompt = f"{contexto_texto}\n\n== PREGUNTA ==\n{pregunta}"
    system = SYSTEM_ESCRITOR if modo == "escritor" else SYSTEM_LECTOR

    client = Groq(api_key=settings.GROQ_API_KEY)
    try:
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model=MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.2,
            max_tokens=512,
        )
        return response.choices[0].message.content or "No se pudo generar una respuesta."
    except Exception as e:
        return f"Error al consultar el asistente: {str(e)}"
