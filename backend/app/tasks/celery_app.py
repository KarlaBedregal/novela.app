from celery import Celery
from app.config import settings


celery = Celery(
    "novela_app",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.procesar_capitulo",
        "app.tasks.generar_embeddings",
        "app.tasks.detectar_contradicciones",
    ],
)

celery.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="America/Lima",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,           # reencolar si el worker muere en medio de una tarea
    worker_prefetch_multiplier=1,  # un capítulo a la vez por worker
)
