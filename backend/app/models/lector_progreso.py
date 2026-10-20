from sqlalchemy import Integer, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base


class LectorProgreso(Base):
    __tablename__ = "lector_progreso"

    id:            Mapped[int] = mapped_column(primary_key=True)
    usuario_id:    Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    manuscrito_id: Mapped[int] = mapped_column(ForeignKey("manuscritos.id"), nullable=False)

    ultimo_capitulo_leido: Mapped[int | None] = mapped_column(Integer)
    ultimo_parrafo_leido:  Mapped[int | None] = mapped_column(Integer)

    # Para el grafo del lector con fog-of-war
    cap_max_grafo_revelado: Mapped[int] = mapped_column(Integer, default=0)

    fecha_inicio:          Mapped[DateTime | None] = mapped_column(DateTime(timezone=True))
    fecha_ultima_lectura:  Mapped[DateTime | None] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True),
                                                  server_default=func.now(), onupdate=func.now())
