"""
Punto de entrada para el worker Celery.
Correr con: celery -A celery_worker.celery worker --loglevel=info
"""
from app.tasks.celery_app import celery

if __name__ == "__main__":
    celery.start()
