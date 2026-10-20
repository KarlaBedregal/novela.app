from sqlalchemy import String, Boolean, Integer, ForeignKey, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base


class Manuscrito(Base):
    __tablename__ = "manuscritos"

    id:          Mapped[int] = mapped_column(primary_key=True)
    usuario_id:  Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    titulo:      Mapped[str] = mapped_column(String(255), nullable=False)
    genero:      Mapped[str | None] = mapped_column(String(50))   # romance/fantasia/thriller/etc.

    # contenido: general / maduro / adulto
    nivel_contenido: Mapped[str] = mapped_column(String(20), default="general")

    # estado del manuscrito como proyecto
    estado: Mapped[str] = mapped_column(String(20), default="borrador")
    # borrador → procesando → procesado → publicado

    # privacidad (V1: envelope encryption)
    encriptado:    Mapped[bool]      = mapped_column(Boolean, default=False)
    dek_encriptada: Mapped[bytes | None] = mapped_column()  # DEK cifrada con KEK del usuario

    # UI inmersiva: tema visual, paleta, ambientación sonora
    configuracion_inmersiva: Mapped[dict | None] = mapped_column(JSON)

    # sinopsis pública (para lectores)
    sinopsis: Mapped[str | None] = mapped_column(String(2000))
    portada_url: Mapped[str | None] = mapped_column(String(500))

    # monetización (V2)
    publicado:    Mapped[bool] = mapped_column(Boolean, default=False)
    precio_capitulo: Mapped[int | None] = mapped_column(Integer)  # en centavos

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    usuario:    Mapped["Usuario"]         = relationship(back_populates="manuscritos")
    capitulos:  Mapped[list["Capitulo"]]  = relationship(back_populates="manuscrito",
                                                          order_by="Capitulo.numero")
    nodos:      Mapped[list["NodoGrafo"]] = relationship(back_populates="manuscrito")
    aristas:    Mapped[list["AristaGrafo"]] = relationship(back_populates="manuscrito")
    eventos_canon: Mapped[list["CanonEvento"]] = relationship(back_populates="manuscrito")
