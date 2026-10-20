from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.nodo_grafo import NodoGrafo
from app.models.arista_grafo import AristaGrafo
from app.models.manuscrito import Manuscrito
from app.models.capitulo import Capitulo
from app.models.usuario import Usuario
from app.schemas.grafo import GrafoCompleto, NodoGrafoOut, AristaGrafoOut, CorreccionRequest, CorreccionResponse
from app.core.dependencies import get_current_user, get_optional_user

router = APIRouter()


@router.get("/{manuscrito_id}", response_model=GrafoCompleto)
async def obtener_grafo(
    manuscrito_id: int,
    solo_canon: bool = False,     # filtra solo nodos/aristas confirmados
    cap_max: int | None = None,   # para vista del lector con fog-of-war
    usuario: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    await _verificar_acceso(session, manuscrito_id, usuario.id)

    estados = ["canon"] if solo_canon else ["canon", "suggestion", "draft", "ambiguous", "contradictory"]

    nodos_q = select(NodoGrafo).where(
        NodoGrafo.manuscrito_id == manuscrito_id,
        NodoGrafo.estado.in_(estados),
    )
    if cap_max is not None:
        nodos_q = nodos_q.where(NodoGrafo.primer_cap_aparicion <= cap_max)

    aristas_q = select(AristaGrafo).where(
        AristaGrafo.manuscrito_id == manuscrito_id,
        AristaGrafo.estado.in_(estados),
        AristaGrafo.supersedida_por_id.is_(None),  # excluir superseded por defecto
    )
    if cap_max is not None:
        aristas_q = aristas_q.where(AristaGrafo.cap_inicio <= cap_max)

    nodos   = (await session.execute(nodos_q)).scalars().all()
    aristas = (await session.execute(aristas_q)).scalars().all()

    return GrafoCompleto(manuscrito_id=manuscrito_id, nodos=nodos, aristas=aristas)


@router.get("/{manuscrito_id}/lector", response_model=GrafoCompleto)
async def obtener_grafo_lector(
    manuscrito_id: int,
    cap_max: int | None = None,
    usuario: Optional[Usuario] = Depends(get_optional_user),
    session: AsyncSession = Depends(get_db),
):
    """Grafo público para lectores — solo nodos canon con fog-of-war hasta el cap libre más alto."""
    max_cap_libre = (await session.execute(
        select(func.max(Capitulo.numero)).where(
            Capitulo.manuscrito_id == manuscrito_id,
            Capitulo.acceso_libre == True,
        )
    )).scalar_one_or_none()

    if max_cap_libre is None:
        raise HTTPException(status_code=404, detail="Novela no disponible")

    # El autor puede ver hasta el último capítulo publicado sin fog-of-war adicional
    es_autor = False
    if usuario:
        m = await session.get(Manuscrito, manuscrito_id)
        if m and m.usuario_id == usuario.id:
            es_autor = True

    # Los lectores no pueden ver más allá del último capítulo con acceso libre
    if not es_autor:
        cap_max = min(cap_max, max_cap_libre) if cap_max is not None else max_cap_libre

    estados_visibles = ["canon", "ambiguous", "suggestion"]

    nodos_q = select(NodoGrafo).where(
        NodoGrafo.manuscrito_id == manuscrito_id,
        NodoGrafo.estado.in_(estados_visibles),
    )
    if cap_max is not None:
        nodos_q = nodos_q.where(NodoGrafo.primer_cap_aparicion <= cap_max)

    aristas_q = select(AristaGrafo).where(
        AristaGrafo.manuscrito_id == manuscrito_id,
        AristaGrafo.estado.in_(estados_visibles),
        AristaGrafo.supersedida_por_id.is_(None),
    )
    if cap_max is not None:
        aristas_q = aristas_q.where(AristaGrafo.cap_inicio <= cap_max)

    nodos   = (await session.execute(nodos_q)).scalars().all()
    aristas = (await session.execute(aristas_q)).scalars().all()

    return GrafoCompleto(manuscrito_id=manuscrito_id, nodos=nodos, aristas=aristas)


@router.post("/{manuscrito_id}/correccion", response_model=CorreccionResponse)
async def enviar_correccion(
    manuscrito_id: int,
    datos: CorreccionRequest,
    usuario: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """El escritor envía una corrección al agente para validarla contra el texto."""
    await _verificar_acceso(session, manuscrito_id, usuario.id)

    from app.agents.agente_corrector import validar_correccion
    from app.models.capitulo import Capitulo

    cap_num = datos.capitulo_referencia or 1
    capitulo = (await session.execute(
        select(Capitulo)
        .where(Capitulo.manuscrito_id == manuscrito_id, Capitulo.numero == cap_num)
    )).scalar_one_or_none()

    if not capitulo:
        return CorreccionResponse(
            resultado="no_encontrada",
            mensaje=f"No se encontró el capítulo {cap_num}",
        )

    from app.agents.agente_corrector import GeminiNoDisponible
    try:
        resultado = await validar_correccion(
            descripcion=datos.descripcion,
            texto_capitulo_anonimizado=capitulo.texto_anonimizado or "",
            numero_capitulo=cap_num,
            mapa_anonimizacion=capitulo.mapa_anonimizacion or {},
        )
    except GeminiNoDisponible as e:
        raise HTTPException(status_code=503, detail=str(e))

    return CorreccionResponse(
        resultado=resultado["resultado"],
        mensaje=resultado["explicacion"],
        cambios=[{"fragmento": resultado.get("fragmento_evidencia")}] if resultado.get("fragmento_evidencia") else None,
    )


async def _verificar_acceso(session, manuscrito_id: int, usuario_id: int):
    m = await session.get(Manuscrito, manuscrito_id)
    if not m or m.usuario_id != usuario_id:
        raise HTTPException(status_code=404, detail="Manuscrito no encontrado")
