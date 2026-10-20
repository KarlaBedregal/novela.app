from sqlalchemy import String, Integer, ForeignKey, Text, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base


class Capitulo(Base):
    __tablename__ = "capitulos"

    id:            Mapped[int] = mapped_column(primary_key=True)
    manuscrito_id: Mapped[int] = mapped_column(ForeignKey("manuscritos.id"), nullable=False)
    numero:        Mapped[int] = mapped_column(Integer, nullable=False)
    titulo:        Mapped[str | None] = mapped_column(String(255))

    texto_plano:       Mapped[str | None] = mapped_column(Text)  # MVP: sin encriptar
    texto_encriptado:  Mapped[bytes | None] = mapped_column()    # V1: AES-256-GCM
    texto_anonimizado: Mapped[str | None] = mapped_column(Text)  # lo que va a la IA
    mapa_anonimizacion: Mapped[dict | None] = mapped_column(JSON)  # {[CHAR_A]: "Elena", ...}

    version_actual:    Mapped[int] = mapped_column(Integer, default=1)
    total_palabras:    Mapped[int | None] = mapped_column(Integer)

    estado_procesamiento: Mapped[str] = mapped_column(String(20), default="pendiente")
    # pendiente → en_cola → procesando → completado → error

    # monetización (V2)
    acceso_libre: Mapped[bool] = mapped_column(default=True)
    precio:       Mapped[int | None] = mapped_column(Integer)  # en centavos

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    manuscrito: Mapped["Manuscrito"]            = relationship(back_populates="capitulos")
    versiones:  Mapped[list["VersionCapitulo"]] = relationship(back_populates="capitulo",
                                                                order_by="VersionCapitulo.numero_version")


class VersionCapitulo(Base):
    __tablename__ = "versiones_capitulo"

    id:             Mapped[int] = mapped_column(primary_key=True)
    capitulo_id:    Mapped[int] = mapped_column(ForeignKey("capitulos.id"), nullable=False)
    numero_version: Mapped[int] = mapped_column(Integer, nullable=False)
    diff:           Mapped[dict | None] = mapped_column(JSON)  # cambios respecto a versión anterior
    total_palabras: Mapped[int | None] = mapped_column(Integer)
    created_at:     Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    capitulo: Mapped["Capitulo"] = relationship(back_populates="versiones")
