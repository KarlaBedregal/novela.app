from sqlalchemy import String, Integer, ForeignKey, Text, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base


class NodoGrafo(Base):
    __tablename__ = "nodos_grafo"

    id:            Mapped[int] = mapped_column(primary_key=True)
    manuscrito_id: Mapped[int] = mapped_column(ForeignKey("manuscritos.id"), nullable=False)

    tipo: Mapped[str] = mapped_column(String(20))
    # personaje / lugar / objeto / evento

    nombre:            Mapped[str]      = mapped_column(String(200), nullable=False)
    nombre_anonimizado: Mapped[str | None] = mapped_column(String(50))   # [CHAR_A], [LOC_1], etc.
    descripcion:       Mapped[str | None] = mapped_column(Text)

    primer_cap_aparicion: Mapped[int | None] = mapped_column(Integer)
    ultimo_cap_aparicion:  Mapped[int | None] = mapped_column(Integer)

    metadatos: Mapped[dict | None] = mapped_column(JSON)
    # {apodos: [...], atributos_fisicos: {...}, rol: "protagonista", etc.}

    # Estado del canon (6 valores)
    estado: Mapped[str] = mapped_column(String(20), default="suggestion")
    # suggestion / canon / draft / ambiguous / contradictory / superseded

    # Provenance: fragmento exacto del texto que justificó la extracción
    fuente_primera_mencion: Mapped[str | None] = mapped_column(Text)
    cap_fuente_id:  Mapped[int | None] = mapped_column(ForeignKey("capitulos.id"))
    pos_inicio:     Mapped[int | None] = mapped_column(Integer)  # offset en caracteres
    pos_fin:        Mapped[int | None] = mapped_column(Integer)

    # Context priority para RAG
    prioridad: Mapped[str] = mapped_column(String(1), default="B")
    # S / A / B / C  (S = siempre en contexto; C = solo si se pregunta directamente)
    prioridad_override: Mapped[bool] = mapped_column(default=False)  # True = el autor lo fijó manualmente

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), onupdate=func.now())

    manuscrito: Mapped["Manuscrito"] = relationship(back_populates="nodos")
    aristas_salientes: Mapped[list["AristaGrafo"]] = relationship(
        foreign_keys="AristaGrafo.nodo_origen_id", back_populates="nodo_origen"
    )
    aristas_entrantes: Mapped[list["AristaGrafo"]] = relationship(
        foreign_keys="AristaGrafo.nodo_destino_id", back_populates="nodo_destino"
    )
