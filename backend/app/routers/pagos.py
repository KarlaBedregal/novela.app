"""
Router de pagos (V2).
MVP: solo stubs. La lógica real se activa cuando se integra Stripe.
"""
from fastapi import APIRouter, Request, HTTPException
from app.config import settings

router = APIRouter()


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    """Recibe eventos de Stripe (suscripciones, pagos, etc.)."""
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=501, detail="Pagos no activados en MVP")

    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")

    # TODO (V2): verificar firma, procesar evento
    # import stripe
    # event = stripe.Webhook.construct_event(payload, sig, settings.STRIPE_WEBHOOK_SECRET)
    return {"received": True}


@router.post("/stripe/connect/webhook")
async def stripe_connect_webhook(request: Request):
    """Eventos de Stripe Connect (pagos a escritores)."""
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=501, detail="Pagos no activados en MVP")
    # TODO (V2)
    return {"received": True}


@router.get("/planes")
async def obtener_planes():
    """Retorna los planes disponibles con precios."""
    return {
        "escritor": [
            {"id": "explorador", "nombre": "Explorador", "precio": 0,    "descripcion": "Gratuito, funciones básicas"},
            {"id": "creador",    "nombre": "Creador",    "precio": 800,  "descripcion": "~$8/mes, grafo completo"},
            {"id": "estudio",    "nombre": "Estudio",    "precio": 1800, "descripcion": "~$18/mes, analytics + API"},
        ],
        "lector": [
            {"id": "lector",         "nombre": "Lector",         "precio": 0,   "descripcion": "Gratuito"},
            {"id": "lector_premium", "nombre": "Lector Premium", "precio": 400, "descripcion": "~$4/mes (V2)"},
        ],
    }
