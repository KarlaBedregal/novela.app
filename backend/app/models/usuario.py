from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id:                       Mapped[int]  = mapped_column(primary_key=True)
    email:                    Mapped[str]  = mapped_column(String(255), unique=True, nullable=False)
    nombre:                   Mapped[str]  = mapped_column(String(100))
    hashed_password:          Mapped[str]  = mapped_column(String(255))
    activo:                   Mapped[bool] = mapped_column(Boolean, default=True)

    # Stripe (suscripción escritor)
    stripe_customer_id:         Mapped[str | None] = mapped_column(String(100))
    subscription_status:        Mapped[str | None] = mapped_column(String(30))   # active/canceled/trialing
    subscription_tier:          Mapped[str | None] = mapped_column(String(20))   # explorador/creador/estudio
    current_period_end:         Mapped[DateTime | None] = mapped_column(DateTime(timezone=True))

    # Stripe Connect (pagos a escritores, V2)
    stripe_connect_account_id:  Mapped[str | None] = mapped_column(String(100))
    connect_onboarded:          Mapped[bool] = mapped_column(Boolean, default=False)

    # Perfil público
    bio:        Mapped[str | None] = mapped_column(String(500), default=None)
    avatar_url: Mapped[str | None] = mapped_column(String(500), default=None)

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    manuscritos: Mapped[list["Manuscrito"]] = relationship(back_populates="usuario")
