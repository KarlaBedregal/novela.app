from sqlalchemy import String, Integer, ForeignKey, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base


class CanonEvento(Base):
    """
    Audit trail append-only del grafo de canon.
    Nunca se borra una fila. Solo se agregan eventos nuevos.
    Esto permite reconstruir cómo llegó el grafo a su estado actual.
    """
    __tablename__ = "canon_eventos"

    id:            Mapped[int] = mapped_column(primary_key=True)
    manuscrito_id: Mapped[int] = mapped_column(ForeignKey("manuscritos.id"), nullable=False)

    tipo_evento: Mapped[str] = mapped_column(String(40))
    # extraccion_ia / confirmacion_autor / rechazo_autor / correccion /
    # marcado_contradictorio / supersesion / cambio_prioridad

    entidad_tipo: Mapped[str] = mapped_column(String(10))  # nodo / arista
    entidad_id:   Mapped[int] = mapped_column(Integer)

    estado_anterior: Mapped[str | None] = mapped_column(String(20))
    estado_nuevo:    Mapped[str | None] = mapped_column(String(20))

    descripcion: Mapped[str | None] = mapped_column(Text)
    # log del agente o nota del autor explicando el cambio

    realizado_por: Mapped[str] = mapped_column(String(10))  # ia / autor

    # Si fue el autor, referencia al usuario
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    manuscrito: Mapped["Manuscrito"] = relationship(back_populates="eventos_canon")
