"""
M1 — Anonimizador de entidades nombradas.

Pipeline:
  1. spaCy detecta PER, LOC, ORG, MISC
  2. Filtro de calidad: descarta pronombres, sustantivos comunes, palabras cortas,
     entidades con POS incorrecto, y MISC ruidoso
  3. Heurística extra: palabras capitalizadas mid-sentence que aparecen ≥2 veces
     (captura nombres inventados que spaCy no reconoce, como "Bugión")
  4. Se asigna un token anónimo a cada entidad única: Elena → [CHAR_A]
  5. El mapa {[CHAR_A]: "Elena"} se guarda en la DB (encriptado en V1)

Por qué anonimizar antes de mandar a Gemini:
  La API externa nunca ve los nombres reales del autor.
"""
import re
from dataclasses import dataclass

try:
    import spacy
    _SPACY_DISPONIBLE = True
except ImportError:
    _SPACY_DISPONIBLE = False

_nlp = None

# Pronombres, artículos y palabras funcionales que spaCy taguea como entidades en ficción
_IGNORAR: set[str] = {
    "él", "ella", "ellos", "ellas", "yo", "tú", "vos", "usted", "ustedes",
    "nosotros", "nosotras", "vosotros", "vosotras",
    "le", "lo", "la", "los", "las", "se", "me", "te", "nos", "os",
    "este", "esta", "estos", "estas", "ese", "esa", "esos", "esas",
    "aquel", "aquella", "aquellos", "aquellas",
    "algo", "alguien", "nadie", "nada", "todo", "todos", "toda", "todas",
    "uno", "una", "unos", "unas", "cada",
    "el", "la", "los", "las", "un", "una", "unos", "unas",
    "más", "muy", "bien", "mal", "así", "tal", "cual", "ya",
    "señor", "señora", "señorita", "don", "doña",
}

# Sustantivos comunes del español que spaCy confunde con LOC/ORG en textos de ficción.
# Se aplica al núcleo (sin artículo inicial) en minúsculas.
_SUSTANTIVOS_COMUNES: set[str] = {
    # Espacios físicos genéricos
    "vagón", "ventana", "habitación", "puerta", "mesa", "silla", "cama",
    "suelo", "techo", "pared", "pasillo", "escalera", "sala", "cuarto",
    "cocina", "comedor", "dormitorio", "baño", "despacho", "oficina",
    "umbral", "entrada", "salida", "balcón", "terraza", "sótano", "ático",
    "esquina", "rincón", "centro", "borde", "fondo", "corredor", "recibidor",
    "estancia", "nave", "celda", "calabozo", "mazmorra",
    # Geografía genérica (sin nombre propio)
    "jardín", "bosque", "camino", "río", "mar", "lago", "montaña", "cielo",
    "campo", "valle", "colina", "llanura", "desierto", "selva", "playa",
    "calle", "plaza", "edificio", "casa", "cueva", "túnel", "puente", "torre",
    "banco", "árbol", "piedra", "tierra", "agua", "fuego", "aire", "viento",
    # Transporte
    "tren", "coche", "barco", "avión", "carruaje", "diligencia",
    "carreta", "carroza", "buque", "navío", "aeronave",
    # Tiempo / abstractos
    "noche", "día", "hora", "momento", "vez", "rato", "instante",
    "mañana", "tarde", "noche", "amanecer", "atardecer", "medianoche",
    # Otros sustantivos que confunden a spaCy
    "lugar", "sitio", "espacio", "interior", "exterior",
    "luz", "sombra", "oscuridad", "silencio", "ruido", "olor", "calor", "frío",
    "lado", "frente", "detrás", "arriba", "abajo",
}

# Artículos iniciales que spaCy incluye en el span pero no son parte del nombre propio
_ARTICULOS_INICIALES = (
    "el ", "la ", "los ", "las ", "un ", "una ", "unos ", "unas ",
    "El ", "La ", "Los ", "Las ", "Un ", "Una ",
)

_LONGITUD_MINIMA = 3


def _get_nlp():
    global _nlp
    if not _SPACY_DISPONIBLE:
        raise RuntimeError("spaCy no está instalado.")
    if _nlp is None:
        _nlp = spacy.load("es_core_news_lg")
    return _nlp


@dataclass
class ResultadoAnonimizacion:
    texto_anonimizado:    str
    mapa_anonimizacion:   dict[str, str]   # {token: nombre_real}
    mapa_inverso:         dict[str, str]   # {nombre_real: token}
    entidades_detectadas: list[dict]       # [{texto, tipo, inicio, fin, token}]


def _nucleo(nombre: str) -> str:
    """Quita artículo inicial: 'el vagón' → 'vagón', 'El Castillo Negro' → 'Castillo Negro'."""
    for art in _ARTICULOS_INICIALES:
        if nombre.startswith(art):
            return nombre[len(art):]
    return nombre


def _es_valida_spacy(nombre: str, label: str, texto: str, ent_spacy=None) -> bool:
    """Filtra entidades ruidosas detectadas por spaCy."""
    nombre_stripped = nombre.strip()
    if len(nombre_stripped) < _LONGITUD_MINIMA:
        return False
    if nombre_stripped.lower() in _IGNORAR:
        return False

    if label == "PER":
        if ent_spacy is not None:
            tokens = list(ent_spacy)
            all_verb_adj = all(t.pos_ in ("VERB", "ADJ", "ADP", "DET", "CCONJ", "SCONJ") for t in tokens)
            if all_verb_adj:
                return False
            if len(tokens) == 1 and tokens[0].pos_ not in ("PROPN", "NOUN"):
                return False
        # Verbos conjugados en 3ª persona del pretérito que spaCy etiqueta como PROPN:
        # "Miró", "Entró", "Llegó", "Salió", "Corrió", etc.
        # Nombres propios reales que terminen en -ó son extremadamente raros en español.
        w = nombre_stripped
        if len(w) >= 3 and w[-1] == "ó":   # ó
            return False
        if len(w) >= 4 and w[-2:] == "ió": # ió
            return False

    if label in ("LOC", "ORG", "MISC"):
        nucleo = _nucleo(nombre_stripped)
        if not nucleo or not nucleo[0].isupper():
            return False

        palabras = nucleo.split()

        if len(palabras) == 1:
            # Una sola palabra: debe ser PROPN y no un sustantivo común
            if nucleo.lower() in _SUSTANTIVOS_COMUNES:
                return False
            if ent_spacy is not None:
                toks = list(ent_spacy)
                if toks and toks[0].pos_ != "PROPN":
                    return False
            # Requiere ≥2 apariciones para filtrar verbos al inicio de oración
            # ("Entro", "Llegó") que spaCy detecta como entidades por la mayúscula
            if texto.count(nombre_stripped) < 2:
                return False
        else:
            # Multi-palabra: rechazar si contiene verbos, preposiciones o pronombres
            # (indican frase genérica, no nombre propio: "Miro por las ventanas")
            if ent_spacy is not None:
                toks = list(ent_spacy)
                bad_pos = {"VERB", "AUX", "ADP", "PRON"}
                if any(t.pos_ in bad_pos for t in toks):
                    return False
                # Debe tener al menos un token PROPN
                if not any(t.pos_ == "PROPN" for t in toks):
                    return False

    return True


def _detectar_capitalizadas_extra(texto: str, ya_detectadas: set[str]) -> list[dict]:
    """
    Heurística para nombres propios que spaCy no reconoce (nombres inventados, fantasía).
    Busca palabras capitalizadas mid-sentence que aparecen ≥2 veces.
    """
    patron = re.compile(r'(?<=[a-záéíóúüñ,;:\-\"\'])\s+([A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]{2,})')
    conteo: dict[str, list[int]] = {}
    for m in patron.finditer(texto):
        palabra = m.group(1)
        palabra_lower = palabra.lower()
        # Filtrar contra ignorados Y sustantivos comunes
        if palabra_lower in _IGNORAR or palabra_lower in _SUSTANTIVOS_COMUNES:
            continue
        # Saltar si ya existe una entidad más larga que contiene esta palabra
        if palabra in ya_detectadas or any(palabra in ent for ent in ya_detectadas):
            continue
        if palabra not in conteo:
            conteo[palabra] = []
        conteo[palabra].append(m.start(1))

    extras = []
    for nombre, posiciones in conteo.items():
        if len(posiciones) >= 2:
            inicio = posiciones[0]
            extras.append({
                "texto":  nombre,
                "tipo":   "PER",
                "inicio": inicio,
                "fin":    inicio + len(nombre),
            })
    return extras


def anonimizar(texto: str, mapa_existente: dict | None = None) -> ResultadoAnonimizacion:
    """
    Anonimiza un texto reemplazando nombres propios por tokens.

    Si se pasa mapa_existente, reutiliza los tokens ya asignados en capítulos previos
    del mismo manuscrito (esencial para consistencia entre capítulos).
    """
    nlp = _get_nlp()
    doc = nlp(texto)

    mapa = dict(mapa_existente) if mapa_existente else {}
    mapa_inverso = {v: k for k, v in mapa.items()}
    entidades = []
    contador_char = sum(1 for k in mapa if k.startswith("[CHAR_"))
    contador_loc  = sum(1 for k in mapa if k.startswith("[LOC_"))
    contador_org  = sum(1 for k in mapa if k.startswith("[ORG_"))
    contador_obj  = sum(1 for k in mapa if k.startswith("[OBJ_"))

    # --- Paso 1: entidades de spaCy con filtro de calidad ---
    nombres_spacy: set[str] = set()
    for ent in doc.ents:
        nombre = ent.text.strip()
        if not _es_valida_spacy(nombre, ent.label_, texto, ent_spacy=ent):
            continue
        nombres_spacy.add(nombre)

        if nombre in mapa_inverso:
            token = mapa_inverso[nombre]
        else:
            if ent.label_ == "PER":
                token = f"[CHAR_{chr(65 + contador_char)}]"
                contador_char += 1
            elif ent.label_ == "LOC":
                token = f"[LOC_{contador_loc + 1}]"
                contador_loc += 1
            elif ent.label_ == "ORG":
                token = f"[ORG_{contador_org + 1}]"
                contador_org += 1
            elif ent.label_ == "MISC":
                token = f"[OBJ_{contador_obj + 1}]"
                contador_obj += 1
            else:
                continue
            mapa[token] = nombre
            mapa_inverso[nombre] = token

        entidades.append({
            "texto":  nombre,
            "tipo":   ent.label_,
            "inicio": ent.start_char,
            "fin":    ent.end_char,
            "token":  token,
        })

    # Deduplicar: si una entidad es substring de otra más larga, descartar la corta.
    # Ej: ["La Torre Oscura", "Torre Oscura", "Oscura"] → solo "La Torre Oscura".
    todos_nombres = list(mapa_inverso.keys())
    for nombre in list(mapa_inverso.keys()):
        if any(nombre != otro and nombre in otro for otro in todos_nombres):
            token_redundante = mapa_inverso.pop(nombre)
            mapa.pop(token_redundante, None)
            nombres_spacy.discard(nombre)
            entidades[:] = [e for e in entidades if e["texto"] != nombre]

    # --- Paso 2: heurística para nombres inventados que spaCy ignoró ---
    extras = _detectar_capitalizadas_extra(texto, nombres_spacy | set(mapa_inverso.keys()))
    for ent in extras:
        nombre = ent["texto"]
        if nombre in mapa_inverso:
            token = mapa_inverso[nombre]
        else:
            token = f"[CHAR_{chr(65 + contador_char)}]"
            contador_char += 1
            mapa[token] = nombre
            mapa_inverso[nombre] = token

        entidades.append({
            "texto":  nombre,
            "tipo":   "PER",
            "inicio": ent["inicio"],
            "fin":    ent["fin"],
            "token":  token,
        })

    texto_anonimizado = texto
    # Reemplazar de más largo a más corto para evitar solapamientos
    for nombre, token in sorted(mapa_inverso.items(), key=lambda x: -len(x[0])):
        texto_anonimizado = texto_anonimizado.replace(nombre, token)

    return ResultadoAnonimizacion(
        texto_anonimizado=texto_anonimizado,
        mapa_anonimizacion=mapa,
        mapa_inverso=mapa_inverso,
        entidades_detectadas=entidades,
    )


def deanonimizar(texto_anonimizado: str, mapa: dict[str, str]) -> str:
    """Restaura los nombres reales en la respuesta de la IA."""
    resultado = texto_anonimizado
    for token, nombre in mapa.items():
        resultado = resultado.replace(token, nombre)
    return resultado
