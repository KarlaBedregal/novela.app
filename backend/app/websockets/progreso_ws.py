"""
WebSocket para notificar al frontend el progreso de procesamiento de capítulos.
El cliente se conecta a /ws/progreso/{task_id} y recibe updates en tiempo real.
"""
import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()


@router.websocket("/progreso/{task_id}")
async def progreso_websocket(websocket: WebSocket, task_id: str):
    await websocket.accept()

    from app.tasks.celery_app import celery
    from celery.result import AsyncResult

    try:
        while True:
            result = AsyncResult(task_id, app=celery)

            estado = {
                "task_id":  task_id,
                "estado":   result.state,
                "progreso": 0,
                "mensaje":  "",
            }

            if result.state == "PROGRESS":
                info = result.info or {}
                estado.update({
                    "progreso": info.get("progreso", 0),
                    "mensaje":  info.get("mensaje", ""),
                    "datos":    {k: v for k, v in info.items() if k not in ("progreso", "mensaje")},
                })
            elif result.state == "SUCCESS":
                estado.update({"progreso": 100, "mensaje": "Completado", "resultado": result.result})
                await websocket.send_text(json.dumps(estado))
                break
            elif result.state == "FAILURE":
                estado.update({"mensaje": str(result.info), "error": True})
                await websocket.send_text(json.dumps(estado))
                break

            await websocket.send_text(json.dumps(estado))
            await asyncio.sleep(1)

    except WebSocketDisconnect:
        pass
