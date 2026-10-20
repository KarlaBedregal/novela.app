from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioLogin, UsuarioOut, Token
from app.core.security import hash_password, verify_password, create_access_token
from app.core.dependencies import get_current_user

router = APIRouter()


class ActualizarPerfil(BaseModel):
    nombre:     Optional[str] = None
    bio:        Optional[str] = None
    avatar_url: Optional[str] = None


class CambiarPassword(BaseModel):
    password_actual: str
    password_nuevo:  str


@router.post("/registro", response_model=Token, status_code=status.HTTP_201_CREATED)
async def registro(datos: UsuarioCreate, session: AsyncSession = Depends(get_db)):
    existente = (await session.execute(
        select(Usuario).where(Usuario.email == datos.email)
    )).scalar_one_or_none()

    if existente:
        raise HTTPException(status_code=400, detail="Email ya registrado")

    now = datetime.now(timezone.utc)
    usuario = Usuario(
        email=datos.email,
        nombre=datos.nombre,
        hashed_password=hash_password(datos.password),
        subscription_tier="explorador",
        updated_at=now,
    )
    session.add(usuario)
    await session.commit()
    await session.refresh(usuario)

    token = create_access_token(usuario.id)
    return Token(access_token=token, usuario=UsuarioOut.model_validate(usuario))


@router.post("/login", response_model=Token)
async def login(datos: UsuarioLogin, session: AsyncSession = Depends(get_db)):
    usuario = (await session.execute(
        select(Usuario).where(Usuario.email == datos.email)
    )).scalar_one_or_none()

    if not usuario or not verify_password(datos.password, usuario.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    token = create_access_token(usuario.id)
    return Token(access_token=token, usuario=UsuarioOut.model_validate(usuario))


@router.get("/me", response_model=UsuarioOut)
async def me(usuario: Usuario = Depends(get_current_user)):
    return usuario


@router.get("/perfil/{usuario_id}")
async def perfil_publico(usuario_id: int, session: AsyncSession = Depends(get_db)):
    """Perfil público de un autor — sin email, sin datos privados."""
    usuario = await session.get(Usuario, usuario_id)
    if not usuario or not usuario.activo:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    from app.models.manuscrito import Manuscrito
    novelas = (await session.execute(
        select(Manuscrito).where(
            Manuscrito.usuario_id == usuario_id,
            Manuscrito.publicado == True,
        ).order_by(Manuscrito.created_at.desc())
    )).scalars().all()

    return {
        "id": usuario.id,
        "nombre": usuario.nombre,
        "bio": usuario.bio,
        "avatar_url": usuario.avatar_url,
        "created_at": usuario.created_at,
        "novelas": [
            {"id": m.id, "titulo": m.titulo, "genero": m.genero, "sinopsis": m.sinopsis}
            for m in novelas
        ],
    }


@router.patch("/me", response_model=UsuarioOut)
async def actualizar_perfil(
    datos: ActualizarPerfil,
    usuario: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    if datos.nombre is not None:
        usuario.nombre = datos.nombre.strip()
    if datos.bio is not None:
        usuario.bio = datos.bio[:500]
    if datos.avatar_url is not None:
        usuario.avatar_url = datos.avatar_url
    await session.commit()
    await session.refresh(usuario)
    return usuario


@router.post("/cambiar-password")
async def cambiar_password(
    datos: CambiarPassword,
    usuario: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    if not verify_password(datos.password_actual, usuario.hashed_password):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")
    if len(datos.password_nuevo) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")
    usuario.hashed_password = hash_password(datos.password_nuevo)
    await session.commit()
    return {"ok": True}
