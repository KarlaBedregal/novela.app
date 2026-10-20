from sqlalchemy import Integer, ForeignKey, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from app.database import Base


class AnotacionLector(Base):
    __tablename__ = "anotaciones_lector"

    id:            Mapped[int] = mapped_column(primary_key=True)
    usuario_id:    Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    manuscrito_id: Mapped[int] = mapped_column(ForeignKey("manuscritos.id"), nullable=False)
    capitulo_id:   Mapped[int] = mapped_column(ForeignKey("capitulos.id"), nullable=False)

    parrafo_inicio: Mapped[int | None] = mapped_column(Integer)
    parrafo_fin:    Mapped[int | None] = mapped_column(Integer)
    texto_seleccionado: Mapped[str | None] = mapped_column(Text)
    texto_anotacion:    Mapped[str | None] = mapped_column(Text)

    # Guardar la versión del capítulo al momento de anotar
    # para detectar si el autor lo modificó después
    version_capitulo_al_anotar: Mapped[int | None] = mapped_column(Integer)

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
