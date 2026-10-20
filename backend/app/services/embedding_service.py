"""
M3 — Generación y búsqueda de embeddings locales.

Modelo: nomic-embed-text vía Ollama (corre localmente, sin API key).
Almacenamiento: ChromaDB (local).

El texto que se embebe es SIEMPRE el texto anonimizado, nunca el original.
"""
import hashlib
import chromadb
from app.config import settings


_chroma_client = None
_ollama_url = None


def _get_chroma():
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
    return _chroma_client


def _collection_name(manuscrito_id: int) -> str:
    return f"manuscrito_{manuscrito_id}"


async def generar_y_guardar_embeddings(
    manuscrito_id: int,
    capitulo_id: int,
    texto_anonimizado: str,
    prioridad: str = "B",
    chunk_size: int = 500,
) -> list[str]:
    """
    Divide el texto en chunks, genera embeddings con Ollama, guarda en ChromaDB.
    Retorna lista de chroma_ids generados.
    """
    chunks = _dividir_en_chunks(texto_anonimizado, chunk_size)
    if not chunks:
        return []

    chroma = _get_chroma()
    collection = chroma.get_or_create_collection(
        name=_collection_name(manuscrito_id),
        metadata={"hnsw:space": "cosine"},
    )

    ids       = []
    textos    = []
    metadatas = []

    for i, chunk in enumerate(chunks):
        chunk_id = hashlib.sha256(f"{capitulo_id}_{i}_{chunk[:50]}".encode()).hexdigest()[:16]
        ids.append(chunk_id)
        textos.append(chunk)
        metadatas.append({
            "capitulo_id": capitulo_id,
            "posicion":    i,
            "prioridad":   prioridad,
            "manuscrito_id": manuscrito_id,
        })

    embeddings = await _generar_embeddings_ollama(textos)

    collection.upsert(
        ids=ids,
        embeddings=embeddings,
        documents=textos,
        metadatas=metadatas,
    )

    return ids


async def buscar_similares(
    manuscrito_id: int,
    consulta: str,
    n_resultados: int = 5,
    filtro_prioridad: list[str] | None = None,
) -> list[dict]:
    """
    Busca los chunks más similares a la consulta en ChromaDB.
    Opcionalmente filtra por prioridad.
    """
    chroma = _get_chroma()
    collection = chroma.get_or_create_collection(_collection_name(manuscrito_id))

    embedding_consulta = (await _generar_embeddings_ollama([consulta]))[0]

    where = {"prioridad": {"$in": filtro_prioridad}} if filtro_prioridad else None

    resultados = collection.query(
        query_embeddings=[embedding_consulta],
        n_results=n_resultados,
        where=where,
        include=["documents", "metadatas", "distances"],
    )

    return [
        {
            "texto":      resultados["documents"][0][i],
            "metadata":   resultados["metadatas"][0][i],
            "distancia":  resultados["distances"][0][i],
        }
        for i in range(len(resultados["documents"][0]))
    ]


async def _generar_embeddings_ollama(textos: list[str]) -> list[list[float]]:
    import httpx
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            f"{settings.OLLAMA_HOST}/api/embed",
            json={"model": settings.EMBEDDING_MODEL, "input": textos},
        )
        response.raise_for_status()
        return response.json()["embeddings"]


def _dividir_en_chunks(texto: str, chunk_size: int) -> list[str]:
    palabras = texto.split()
    chunks = []
    for i in range(0, len(palabras), chunk_size):
        chunk = " ".join(palabras[i:i + chunk_size])
        if chunk.strip():
            chunks.append(chunk)
    return chunks
