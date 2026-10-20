from sqlalchemy import Integer, ForeignKey, Text, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from app.database import Base


class ReporteContenido(Base):
    __tablename__ = "reportes_contenido"

    id:            Mapped[int] = mapped_column(primary_key=True)
    manuscrito_id: Mapped[int] = mapped_column(ForeignKey("manuscritos.id"), nullable=False)
    capitulo_id:   Mapped[int | None] = mapped_column(ForeignKey("capitulos.id"))
    reportado_por: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))

    categoria: Mapped[str] = mapped_column(String(50))
    # spam / contenido_inapropiado / nivel_incorrecto / plagio / otro

    descripcion: Mapped[str | None] = mapped_column(Text)

    estado: Mapped[str] = mapped_column(String(20), default="pendiente")
    # pendiente / en_revision / resuelto / rechazado

    nota_moderador: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), onupdate=func.now())
