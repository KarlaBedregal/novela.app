from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.manuscrito import Manuscrito
from app.models.usuario import Usuario
from app.schemas.manuscrito import ManuscritoCreate, ManuscritoUpdate, ManuscritoOut
from app.core.dependencies import get_current_user

router = APIRouter()


@router.get("/", response_model=list[ManuscritoOut])
async def listar_manuscritos(
    usuario: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    resultado = await session.execute(
        select(Manuscrito).where(Manuscrito.usuario_id == usuario.id)
        .order_by(Manuscrito.updated_at.desc())
    )
    return resultado.scalars().all()


@router.post("/", response_model=ManuscritoOut, status_code=status.HTTP_201_CREATED)
async def crear_manuscrito(
    datos: ManuscritoCreate,
    usuario: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    manuscrito = Manuscrito(**datos.model_dump(), usuario_id=usuario.id, updated_at=now)
    session.add(manuscrito)
    await session.commit()
    await session.refresh(manuscrito)
    return manuscrito


@router.get("/{id}", response_model=ManuscritoOut)
async def obtener_manuscrito(
    id: int,
    usuario: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    manuscrito = await _get_or_404(session, id, usuario.id)
    return manuscrito


@router.patch("/{id}", response_model=ManuscritoOut)
async def actualizar_manuscrito(
    id: int,
    datos: ManuscritoUpdate,
    usuario: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    manuscrito = await _get_or_404(session, id, usuario.id)
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(manuscrito, campo, valor)
    await session.commit()
    await session.refresh(manuscrito)
    return manuscrito


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_manuscrito(
    id: int,
    usuario: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    manuscrito = await _get_or_404(session, id, usuario.id)
    await session.delete(manuscrito)
    await session.commit()


@router.post("/{id}/publicar", response_model=ManuscritoOut)
async def toggle_publicar(
    id: int,
    usuario: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Publica o despublica el manuscrito (visibilidad en explorar). Los capítulos se publican individualmente."""
    manuscrito = await _get_or_404(session, id, usuario.id)
    manuscrito.publicado = not manuscrito.publicado
    await session.commit()
    await session.refresh(manuscrito)
    return manuscrito


async def _get_or_404(session, id: int, usuario_id: int) -> Manuscrito:
    m = await session.get(Manuscrito, id)
    if not m or m.usuario_id != usuario_id:
        raise HTTPException(status_code=404, detail="Manuscrito no encontrado")
    return m
