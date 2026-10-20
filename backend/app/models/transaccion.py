from sqlalchemy import Integer, ForeignKey, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from app.database import Base


class Transaccion(Base):
    """Transacciones económicas entre lectores y escritores (V2)."""
    __tablename__ = "transacciones"

    id:            Mapped[int] = mapped_column(primary_key=True)
    manuscrito_id: Mapped[int] = mapped_column(ForeignKey("manuscritos.id"), nullable=False)
    lector_id:     Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    escritor_id:   Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)

    tipo: Mapped[str] = mapped_column(String(30))
    # capitulo / propina / suscripcion_directa

    monto_total:     Mapped[int] = mapped_column(Integer)   # en centavos
    monto_escritor:  Mapped[int] = mapped_column(Integer)
    monto_plataforma: Mapped[int] = mapped_column(Integer)

    # Stripe o MercadoPago
    proveedor_pago: Mapped[str | None] = mapped_column(String(20))  # stripe / mercadopago
    payment_intent_id: Mapped[str | None] = mapped_column(String(100))

    estado: Mapped[str] = mapped_column(String(20), default="pendiente")
    # pendiente / completado / reembolsado / fallido

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
