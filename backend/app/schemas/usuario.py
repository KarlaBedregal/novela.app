from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UsuarioCreate(BaseModel):
    email:    EmailStr
    nombre:   str
    password: str


class UsuarioLogin(BaseModel):
    email:    EmailStr
    password: str


class UsuarioOut(BaseModel):
    id:                int
    email:             str
    nombre:            str
    activo:            bool
    subscription_tier: Optional[str]
    bio:               Optional[str] = None
    avatar_url:        Optional[str] = None
    created_at:        datetime

    model_config = {"from_attributes": True}


class PerfilPublico(BaseModel):
    id:         int
    nombre:     str
    bio:        Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    usuario:      UsuarioOut
