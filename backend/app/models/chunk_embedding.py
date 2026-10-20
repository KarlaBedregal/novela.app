from sqlalchemy import String, Integer, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base


class ChunkEmbedding(Base):
    """
    Referencia a los chunks almacenados en ChromaDB.
    PostgreSQL guarda los metadatos; ChromaDB guarda los vectores.
    """
    __tablename__ = "chunks_embedding"

    id:            Mapped[int] = mapped_column(primary_key=True)
    manuscrito_id: Mapped[int] = mapped_column(ForeignKey("manuscritos.id"), nullable=False)
    capitulo_id:   Mapped[int] = mapped_column(ForeignKey("capitulos.id"), nullable=False)

    chroma_id: Mapped[str] = mapped_column(String(100), unique=True)
    # ID que identifica el vector en ChromaDB

    texto_anonimizado: Mapped[str | None] = mapped_column(Text)
    posicion:          Mapped[int | None] = mapped_column(Integer)   # offset en el capítulo
    longitud_tokens:   Mapped[int | None] = mapped_column(Integer)

    # Context priority heredada del capítulo / asignada por el pipeline
    prioridad: Mapped[str] = mapped_column(String(1), default="B")

    encriptado: Mapped[bool] = mapped_column(Boolean, default=False)  # V1

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
