from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.security import decode_token
from app.models.usuario import Usuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_db),
) -> Usuario:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autenticado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub", 0))
    except Exception:
        raise credentials_error

    usuario = await session.get(Usuario, user_id)
    if not usuario or not usuario.activo:
        raise credentials_error
    return usuario


async def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    session: AsyncSession = Depends(get_db),
) -> Optional[Usuario]:
    """Devuelve el usuario autenticado o None si no hay token."""
    if not token:
        return None
    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub", 0))
        usuario = await session.get(Usuario, user_id)
        if usuario and usuario.activo:
            return usuario
    except Exception:
        pass
    return None


async def get_current_writer(
    usuario: Usuario = Depends(get_current_user),
) -> Usuario:
    """Verifica que el usuario tenga suscripción activa como escritor."""
    if usuario.subscription_tier not in ("explorador", "creador", "estudio"):
        raise HTTPException(status_code=403, detail="Se requiere plan de escritor")
    return usuario
