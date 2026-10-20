"""
Extracción de texto plano desde archivos de distintos formatos,
y detección automática de capítulos dentro del texto.
"""
import io
import re
from typing import Optional


# ---------------------------------------------------------------------------
# Extracción de texto
# ---------------------------------------------------------------------------

def extraer_texto(contenido: bytes, nombre_archivo: str) -> str:
    """Extrae texto plano del archivo según su extensión.

    Args:
        contenido: Bytes del archivo.
        nombre_archivo: Nombre original (usado solo para deducir la extensión).

    Returns:
        Texto plano extraído.

    Raises:
        ValueError: Si el formato no está soportado o el archivo está corrupto.
    """
    ext = nombre_archivo.rsplit(".", 1)[-1].lower() if "." in nombre_archivo else ""

    try:
        if ext == "txt":
            return _extraer_txt(contenido)
        elif ext == "docx":
            return _extraer_docx(contenido)
        elif ext == "pdf":
            return _extraer_pdf(contenido)
        elif ext == "odt":
            return _extraer_odt(contenido)
        elif ext == "epub":
            return _extraer_epub(contenido)
        elif ext == "rtf":
            return _extraer_rtf(contenido)
        else:
            raise ValueError(f"Formato no soportado: .{ext}. Formatos aceptados: .txt, .docx, .pdf, .odt, .epub, .rtf")
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError(f"No se pudo leer el archivo '{nombre_archivo}': {exc}") from exc


def _extraer_txt(contenido: bytes) -> str:
    for encoding in ("utf-8", "utf-8-sig", "latin-1", "cp1252"):
        try:
            return contenido.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise ValueError("No se pudo decodificar el archivo .txt (encoding desconocido).")


def _extraer_docx(contenido: bytes) -> str:
    import docx  # python-docx
    doc = docx.Document(io.BytesIO(contenido))
    parrafos = [p.text for p in doc.paragraphs]
    return "\n".join(parrafos)


def _extraer_pdf(contenido: bytes) -> str:
    import fitz  # PyMuPDF
    doc = fitz.open(stream=contenido, filetype="pdf")
    paginas = []
    for pagina in doc:
        paginas.append(pagina.get_text())
    doc.close()
    return "\n".join(paginas)


def _extraer_odt(contenido: bytes) -> str:
    from odf.opendocument import load as odf_load
    from odf.text import P
    from odf.element import Element

    doc = odf_load(io.BytesIO(contenido))

    def _texto_de_elemento(elem: Element) -> str:
        partes = []
        if elem.nodeType == elem.TEXT_NODE:
            partes.append(str(elem))
        for hijo in elem.childNodes:
            partes.append(_texto_de_elemento(hijo))
        return "".join(partes)

    lineas = []
    for parrafo in doc.text.getElementsByType(P):
        lineas.append(_texto_de_elemento(parrafo))
    return "\n".join(lineas)


def _extraer_epub(contenido: bytes) -> str:
    import ebooklib
    from ebooklib import epub
    from html.parser import HTMLParser

    class _StripHTML(HTMLParser):
        def __init__(self):
            super().__init__()
            self._textos: list[str] = []

        def handle_data(self, data: str) -> None:
            self._textos.append(data)

        def get_text(self) -> str:
            return "".join(self._textos)

    libro = epub.read_epub(io.BytesIO(contenido))
    partes: list[str] = []
    for item in libro.get_items_of_type(ebooklib.ITEM_DOCUMENT):
        html_content = item.get_content().decode("utf-8", errors="replace")
        parser = _StripHTML()
        parser.feed(html_content)
        partes.append(parser.get_text())
    return "\n".join(partes)


def _extraer_rtf(contenido: bytes) -> str:
    from striprtf.striprtf import rtf_to_text
    texto_rtf = contenido.decode("latin-1", errors="replace")
    return rtf_to_text(texto_rtf)


# ---------------------------------------------------------------------------
# Detección automática de capítulos
# ---------------------------------------------------------------------------

# Patrones que marcan el inicio de un capítulo/parte/sección.
# Se aplican sobre líneas individuales (strip previo).
_PATRON_CAPITULO = re.compile(
    r"^(?:"
    r"cap[íi]tulo\s+[\dIVXLCDM]+|"   # Capítulo N / Capítulo IV
    r"chapter\s+[\dIVXLCDM]+|"         # Chapter N
    r"parte\s+[\dIVXLCDM]+|"           # Parte N
    r"(?:-{3,}|\*{3,}|={3,})"          # --- / *** / ====
    r")",
    re.IGNORECASE,
)


def detectar_capitulos(texto: str) -> list[dict]:
    """Divide el texto en capítulos según patrones comunes.

    Args:
        texto: Texto completo del archivo.

    Returns:
        Lista de dicts con claves ``numero`` (int), ``titulo`` (str|None),
        ``texto`` (str).  Si no se detectan divisiones, devuelve la lista
        con un único elemento que contiene todo el texto.
    """
    lineas = texto.splitlines()
    cortes: list[tuple[int, Optional[str]]] = []  # (índice_linea, título_detectado)

    for i, linea in enumerate(lineas):
        limpia = linea.strip()
        if _PATRON_CAPITULO.match(limpia):
            # Intentar capturar un posible subtítulo en la siguiente línea no vacía
            titulo = limpia if not re.match(r"^[-*=]+$", limpia) else None
            cortes.append((i, titulo))

    if not cortes:
        return [{"numero": 1, "titulo": None, "texto": texto.strip()}]

    capitulos: list[dict] = []
    for idx, (inicio, titulo) in enumerate(cortes):
        fin = cortes[idx + 1][0] if idx + 1 < len(cortes) else len(lineas)
        # El texto del capítulo empieza en la línea siguiente al encabezado
        cuerpo = "\n".join(lineas[inicio + 1 : fin]).strip()
        capitulos.append({
            "numero": idx + 1,
            "titulo": titulo,
            "texto":  cuerpo,
        })

    # Si hay texto antes del primer corte, agregarlo como capítulo 0 (prólogo)
    texto_previo = "\n".join(lineas[: cortes[0][0]]).strip()
    if texto_previo:
        capitulos.insert(0, {"numero": 0, "titulo": "Prólogo", "texto": texto_previo})
        # Re-numerar
        for i, cap in enumerate(capitulos, start=1):
            cap["numero"] = i

    return capitulos
