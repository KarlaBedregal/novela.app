from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.capitulo import Capitulo, VersionCapitulo
from app.models.manuscrito import Manuscrito
from app.models.usuario import Usuario
from app.schemas.capitulo import CapituloCreate, CapituloUpdate, CapituloOut, ProcesarCapituloResponse
from app.core.dependencies import get_current_user

router = APIRouter()


@router.get("/{manuscrito_id}/capitulos", response_model=list[CapituloOut])
async def listar_capitulos(
    manuscrito_id: int,
    usuario: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    await _verificar_acceso(session, manuscrito_id, usuario.id)
    resultado = await session.execute(
        select(Capitulo).where(Capitulo.manuscrito_id == manuscrito_id)
        .order_by(Capitulo.numero)
    )
    return resultado.scalars().all()


@router.post("/{manuscrito_id}/capitulos", response_model=CapituloOut, status_code=201)
async def crear_capitulo(
    manuscrito_id: int,
    datos: CapituloCreate,
    usuario: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    await _verificar_acceso(session, manuscrito_id, usuario.id)
    now = datetime.now(timezone.utc)
    capitulo = Capitulo(
        manuscrito_id=manuscrito_id,
        numero=datos.numero,
        titulo=datos.titulo,
        texto_plano=datos.texto,
        total_palabras=len(datos.texto.split()),
        updated_at=now,
    )
    session.add(capitulo)
    await session.commit()
    await session.refresh(capitulo)
    return capitulo


@router.post("/{manuscrito_id}/capitulos/importar")
async def importar_capitulos(
    manuscrito_id: int,
    archivo: UploadFile = File(...),
    auto_split: bool = Form(True),
    usuario: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Importa capítulos desde un archivo (.txt, .docx, .pdf, .odt, .epub, .rtf)."""
    await _verificar_acceso(session, manuscrito_id, usuario.id)

    # Leer contenido del archivo
    contenido = await archivo.read()
    nombre = archivo.filename or "archivo"

    # Extraer texto
    from app.services.extractor_archivo import extraer_texto, detectar_capitulos
    try:
        texto = extraer_texto(contenido, nombre)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    if not texto.strip():
        raise HTTPException(status_code=422, detail="El archivo no contiene texto legible.")

    # Determinar siguiente número de capítulo
    resultado_max = await session.execute(
        select(func.max(Capitulo.numero)).where(Capitulo.manuscrito_id == manuscrito_id)
    )
    max_numero = resultado_max.scalar() or 0

    # Dividir en capítulos si corresponde
    if auto_split:
        secciones = detectar_capitulos(texto)
    else:
        secciones = [{"numero": 1, "titulo": None, "texto": texto.strip()}]

    # Crear capítulos en base de datos
    now = datetime.now(timezone.utc)
    creados: list[Capitulo] = []
    for idx, seccion in enumerate(secciones):
        numero = max_numero + idx + 1
        capitulo = Capitulo(
            manuscrito_id=manuscrito_id,
            numero=numero,
            titulo=seccion.get("titulo"),
            texto_plano=seccion["texto"],
            total_palabras=len(seccion["texto"].split()) if seccion["texto"] else 0,
            estado_procesamiento="pendiente",
            acceso_libre=True,
            updated_at=now,
        )
        session.add(capitulo)
        creados.append(capitulo)

    await session.commit()
    for cap in creados:
        await session.refresh(cap)

    return {
        "capitulos_creados": [CapituloOut.model_validate(c) for c in creados],
        "total": len(creados),
    }


@router.get("/{manuscrito_id}/capitulos/{capitulo_id}", response_model=CapituloOut)
async def obtener_capitulo(
    manuscrito_id: int,
    capitulo_id: int,
    usuario: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    await _verificar_acceso(session, manuscrito_id, usuario.id)
    capitulo = await session.get(Capitulo, capitulo_id)
    if not capitulo or capitulo.manuscrito_id != manuscrito_id:
        raise HTTPException(status_code=404, detail="Capítulo no encontrado")
    return capitulo


@router.patch("/{manuscrito_id}/capitulos/{capitulo_id}", response_model=CapituloOut)
async def actualizar_capitulo(
    manuscrito_id: int,
    capitulo_id: int,
    datos: CapituloUpdate,
    usuario: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    await _verificar_acceso(session, manuscrito_id, usuario.id)
    capitulo = await session.get(Capitulo, capitulo_id)
    if not capitulo or capitulo.manuscrito_id != manuscrito_id:
        raise HTTPException(status_code=404, detail="Capítulo no encontrado")

    if datos.texto:
        # Guardar versión anterior antes de actualizar
        version = VersionCapitulo(
            capitulo_id=capitulo_id,
            numero_version=capitulo.version_actual,
            diff={
                "texto_completo": capitulo.texto_plano or "",
                "titulo": capitulo.titulo or "",
            },
            total_palabras=capitulo.total_palabras,
        )
        session.add(version)
        capitulo.version_actual += 1
        capitulo.texto_plano   = datos.texto
        capitulo.total_palabras = len(datos.texto.split())
        capitulo.estado_procesamiento = "pendiente"  # necesita reprocesarse

    if datos.titulo:
        capitulo.titulo = datos.titulo

    if datos.acceso_libre is not None:
        capitulo.acceso_libre = datos.acceso_libre

    await session.commit()
    await session.refresh(capitulo)
    return capitulo


@router.post("/{manuscrito_id}/capitulos/{capitulo_id}/reintentar", response_model=CapituloOut)
async def reintentar_capitulo(
    manuscrito_id: int,
    capitulo_id: int,
    usuario: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Resetea un capítulo atascado a estado 'pendiente'."""
    await _verificar_acceso(session, manuscrito_id, usuario.id)
    capitulo = await session.get(Capitulo, capitulo_id)
    if not capitulo or capitulo.manuscrito_id != manuscrito_id:
        raise HTTPException(status_code=404, detail="Capítulo no encontrado")
    capitulo.estado_procesamiento = "pendiente"
    await session.commit()
    await session.refresh(capitulo)
    return capitulo


@router.post("/{manuscrito_id}/capitulos/{capitulo_id}/procesar",
             response_model=ProcesarCapituloResponse)
async def procesar_capitulo(
    manuscrito_id: int,
    capitulo_id: int,
    usuario: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Encola el capítulo para procesamiento asíncrono (pipeline M1)."""
    await _verificar_acceso(session, manuscrito_id, usuario.id)
    capitulo = await session.get(Capitulo, capitulo_id)
    if not capitulo:
        raise HTTPException(status_code=404, detail="Capítulo no encontrado")

    from app.tasks.procesar_capitulo import procesar_capitulo_task
    task = procesar_capitulo_task.delay(capitulo_id, manuscrito_id)
    capitulo.estado_procesamiento = "en_cola"
    await session.commit()

    return ProcesarCapituloResponse(
        capitulo_id=capitulo_id,
        task_id=task.id,
        mensaje="Capítulo encolado para procesamiento",
    )


@router.get("/{manuscrito_id}/capitulos/{capitulo_id}/versiones")
async def listar_versiones(
    manuscrito_id: int,
    capitulo_id: int,
    usuario: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Lista el historial de versiones guardadas de un capítulo."""
    await _verificar_acceso(session, manuscrito_id, usuario.id)
    capitulo = await session.get(Capitulo, capitulo_id)
    if not capitulo or capitulo.manuscrito_id != manuscrito_id:
        raise HTTPException(status_code=404, detail="Capítulo no encontrado")

    versiones = (await session.execute(
        select(VersionCapitulo)
        .where(VersionCapitulo.capitulo_id == capitulo_id)
        .order_by(VersionCapitulo.numero_version.desc())
    )).scalars().all()

    return [
        {
            "id": v.id,
            "numero_version": v.numero_version,
            "total_palabras": v.total_palabras,
            "created_at": v.created_at.isoformat() if v.created_at else None,
            "tiene_texto": bool(v.diff and v.diff.get("texto_completo")),
            "nota": (v.diff or {}).get("nota"),
        }
        for v in versiones
    ]


@router.post("/{manuscrito_id}/capitulos/{capitulo_id}/versiones/{numero_version}/restaurar")
async def restaurar_version(
    manuscrito_id: int,
    capitulo_id: int,
    numero_version: int,
    usuario: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Restaura el capítulo a una versión anterior. Auto-guarda la versión actual antes."""
    await _verificar_acceso(session, manuscrito_id, usuario.id)
    capitulo = await session.get(Capitulo, capitulo_id)
    if not capitulo or capitulo.manuscrito_id != manuscrito_id:
        raise HTTPException(status_code=404, detail="Capítulo no encontrado")

    version = (await session.execute(
        select(VersionCapitulo).where(
            VersionCapitulo.capitulo_id == capitulo_id,
            VersionCapitulo.numero_version == numero_version,
        )
    )).scalar_one_or_none()

    if not version or not version.diff or not version.diff.get("texto_completo"):
        raise HTTPException(status_code=404, detail="Versión no encontrada o sin texto guardado")

    now = datetime.now(timezone.utc)

    # Auto-guardar versión actual antes de restaurar
    backup = VersionCapitulo(
        capitulo_id=capitulo_id,
        numero_version=capitulo.version_actual,
        diff={
            "texto_completo": capitulo.texto_plano or "",
            "titulo": capitulo.titulo or "",
            "nota": f"Auto-guardado antes de restaurar a v{numero_version}",
        },
        total_palabras=capitulo.total_palabras,
    )
    session.add(backup)

    # Restaurar
    texto = version.diff["texto_completo"]
    titulo = version.diff.get("titulo") or capitulo.titulo
    capitulo.texto_plano = texto
    capitulo.titulo = titulo
    capitulo.total_palabras = len(texto.split())
    capitulo.version_actual += 1
    capitulo.estado_procesamiento = "pendiente"
    capitulo.updated_at = now

    await session.commit()
    await session.refresh(capitulo)

    return {
        "ok": True,
        "mensaje": f"Capítulo restaurado a versión {numero_version}",
        "version_actual": capitulo.version_actual,
        "total_palabras": capitulo.total_palabras,
    }


async def _verificar_acceso(session, manuscrito_id: int, usuario_id: int):
    m = await session.get(Manuscrito, manuscrito_id)
    if not m or m.usuario_id != usuario_id:
        raise HTTPException(status_code=404, detail="Manuscrito no encontrado")
