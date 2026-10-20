from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.lector_progreso import LectorProgreso
from app.models.anotacion_lector import AnotacionLector
from app.models.manuscrito import Manuscrito
from app.models.capitulo import Capitulo
from app.models.usuario import Usuario
from app.core.dependencies import get_current_user, get_optional_user

router = APIRouter()


class ProgresoUpdate(BaseModel):
    manuscrito_id:          int
    ultimo_capitulo_leido:  int
    ultimo_parrafo_leido:   int | None = None


class AnotacionCreate(BaseModel):
    manuscrito_id:          int
    capitulo_id:            int
    parrafo_inicio:         int | None = None
    parrafo_fin:            int | None = None
    texto_seleccionado:     str | None = None
    texto_anotacion:        str


@router.get("/explorar")
async def explorar_novelas(
    genero: str | None = None,
    pagina: int = 1,
    session: AsyncSession = Depends(get_db),
):
    """Catálogo público — manuscritos con al menos un capítulo publicado."""
    from sqlalchemy import exists as sa_exists
    tiene_cap_libre = sa_exists().where(
        Capitulo.manuscrito_id == Manuscrito.id,
        Capitulo.acceso_libre == True,
    )
    q = select(Manuscrito).where(tiene_cap_libre)
    if genero:
        q = q.where(Manuscrito.genero == genero)
    q = q.order_by(Manuscrito.updated_at.desc()).offset((pagina - 1) * 20).limit(20)
    resultado = await session.execute(q)
    return resultado.scalars().all()


@router.get("/novela/{manuscrito_id}/capitulo/{numero}")
async def leer_capitulo(
    manuscrito_id: int,
    numero: int,
    usuario: Optional[Usuario] = Depends(get_optional_user),
    session: AsyncSession = Depends(get_db),
):
    """Retorna el texto de un capítulo para lectura inmersiva."""
    capitulo = (await session.execute(
        select(Capitulo).where(
            Capitulo.manuscrito_id == manuscrito_id,
            Capitulo.numero == numero,
        )
    )).scalar_one_or_none()

    if not capitulo:
        raise HTTPException(status_code=404, detail="Capítulo no encontrado")

    if not capitulo.acceso_libre:
        if usuario is None:
            raise HTTPException(status_code=401, detail="Inicia sesión para acceder")
        raise HTTPException(status_code=402, detail="Capítulo de pago")  # V2

    return {"texto": capitulo.texto_plano, "titulo": capitulo.titulo, "numero": numero}


@router.post("/progreso")
async def actualizar_progreso(
    datos: ProgresoUpdate,
    usuario: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    progreso = (await session.execute(
        select(LectorProgreso).where(
            LectorProgreso.usuario_id == usuario.id,
            LectorProgreso.manuscrito_id == datos.manuscrito_id,
        )
    )).scalar_one_or_none()

    if not progreso:
        from datetime import datetime, timezone
        progreso = LectorProgreso(
            usuario_id=usuario.id,
            manuscrito_id=datos.manuscrito_id,
            fecha_inicio=datetime.now(timezone.utc),
        )
        session.add(progreso)

    progreso.ultimo_capitulo_leido  = datos.ultimo_capitulo_leido
    progreso.ultimo_parrafo_leido   = datos.ultimo_parrafo_leido
    progreso.cap_max_grafo_revelado = datos.ultimo_capitulo_leido
    await session.commit()
    return {"ok": True}


@router.get("/novela/{manuscrito_id}")
async def portada_novela(
    manuscrito_id: int,
    session: AsyncSession = Depends(get_db),
):
    """Retorna portada pública del manuscrito con sus capítulos de acceso libre."""
    manuscrito = await session.get(Manuscrito, manuscrito_id)
    if not manuscrito:
        raise HTTPException(status_code=404, detail="Novela no encontrada")

    # Visible si tiene al menos un capítulo con acceso libre
    primer_cap_libre = (await session.execute(
        select(Capitulo).where(
            Capitulo.manuscrito_id == manuscrito_id,
            Capitulo.acceso_libre == True,
        ).limit(1)
    )).scalar_one_or_none()
    if not primer_cap_libre:
        raise HTTPException(status_code=404, detail="Novela no encontrada")

    autor = await session.get(Usuario, manuscrito.usuario_id)

    # Capítulos de acceso libre ordenados
    caps_result = await session.execute(
        select(Capitulo)
        .where(
            Capitulo.manuscrito_id == manuscrito_id,
            Capitulo.acceso_libre == True,
        )
        .order_by(Capitulo.numero)
    )
    capitulos = caps_result.scalars().all()

    # Total de capítulos del manuscrito (sin filtro de acceso)
    total_result = await session.execute(
        select(Capitulo).where(Capitulo.manuscrito_id == manuscrito_id)
    )
    total_capitulos = len(total_result.scalars().all())

    return {
        "id": manuscrito.id,
        "titulo": manuscrito.titulo,
        "sinopsis": manuscrito.sinopsis,
        "genero": manuscrito.genero,
        "nivel_contenido": manuscrito.nivel_contenido,
        "autor_nombre": autor.nombre if autor else "Desconocido",
        "autor_id": manuscrito.usuario_id,
        "total_capitulos": total_capitulos,
        "capitulos": [
            {
                "id": c.id,
                "numero": c.numero,
                "titulo": c.titulo,
                "total_palabras": c.total_palabras,
                "acceso_libre": c.acceso_libre,
            }
            for c in capitulos
        ],
    }


@router.get("/mi-biblioteca")
async def mi_biblioteca(
    usuario: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Retorna los manuscritos que el usuario está leyendo con su progreso."""
    progresos_result = await session.execute(
        select(LectorProgreso).where(LectorProgreso.usuario_id == usuario.id)
    )
    progresos = progresos_result.scalars().all()

    respuesta = []
    for p in progresos:
        manuscrito = await session.get(Manuscrito, p.manuscrito_id)
        if not manuscrito:
            continue

        total_result = await session.execute(
            select(Capitulo).where(Capitulo.manuscrito_id == p.manuscrito_id)
        )
        total_capitulos = len(total_result.scalars().all())

        respuesta.append({
            "manuscrito_id": p.manuscrito_id,
            "titulo": manuscrito.titulo,
            "genero": manuscrito.genero,
            "ultimo_capitulo_leido": p.ultimo_capitulo_leido,
            "total_capitulos": total_capitulos,
        })

    return respuesta


@router.post("/anotacion", status_code=201)
async def crear_anotacion(
    datos: AnotacionCreate,
    usuario: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    capitulo = await session.get(Capitulo, datos.capitulo_id)
    anotacion = AnotacionLector(
        usuario_id=usuario.id,
        version_capitulo_al_anotar=capitulo.version_actual if capitulo else None,
        **datos.model_dump(),
    )
    session.add(anotacion)
    await session.commit()
    return {"ok": True}
