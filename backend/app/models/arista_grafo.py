from sqlalchemy import String, Integer, ForeignKey, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base


class AristaGrafo(Base):
    __tablename__ = "aristas_grafo"

    id:            Mapped[int] = mapped_column(primary_key=True)
    manuscrito_id: Mapped[int] = mapped_column(ForeignKey("manuscritos.id"), nullable=False)

    nodo_origen_id:  Mapped[int] = mapped_column(ForeignKey("nodos_grafo.id"), nullable=False)
    nodo_destino_id: Mapped[int] = mapped_column(ForeignKey("nodos_grafo.id"), nullable=False)

    tipo_relacion: Mapped[str] = mapped_column(String(100))
    # amigo_de / enemigo_de / hermano_de / traiciono_a / descubrió / posee / etc.
    descripcion: Mapped[str | None] = mapped_column(Text)

    # Rango de capítulos en que la relación es válida
    cap_inicio: Mapped[int | None] = mapped_column(Integer)
    cap_fin:    Mapped[int | None] = mapped_column(Integer)

    # Estado del canon (6 valores — misma semántica que NodoGrafo)
    estado: Mapped[str] = mapped_column(String(20), default="suggestion")

    # Provenance: fragmento exacto del texto que justificó la relación
    fuente_texto:  Mapped[str | None] = mapped_column(Text)
    cap_fuente_id: Mapped[int | None] = mapped_column(ForeignKey("capitulos.id"))
    pos_inicio:    Mapped[int | None] = mapped_column(Integer)
    pos_fin:       Mapped[int | None] = mapped_column(Integer)

    # Supersesión: si esta arista fue reemplazada, apunta a la nueva
    supersedida_por_id: Mapped[int | None] = mapped_column(ForeignKey("aristas_grafo.id"))

    # Context priority
    prioridad: Mapped[str] = mapped_column(String(1), default="B")

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), onupdate=func.now())

    manuscrito:   Mapped["Manuscrito"] = relationship(back_populates="aristas")
    nodo_origen:  Mapped["NodoGrafo"]  = relationship(foreign_keys=[nodo_origen_id],
                                                       back_populates="aristas_salientes")
    nodo_destino: Mapped["NodoGrafo"]  = relationship(foreign_keys=[nodo_destino_id],
                                                       back_populates="aristas_entrantes")
    supersedida_por: Mapped["AristaGrafo | None"] = relationship(
        foreign_keys=[supersedida_por_id], remote_side="AristaGrafo.id"
    )
