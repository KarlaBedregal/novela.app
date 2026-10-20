from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.config import settings
from app.routers import auth, manuscritos, capitulos, grafo, canon, lector, pagos, ia
from app.websockets.progreso_ws import router as ws_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: inicializar Ollama, ChromaDB, etc.
    yield
    # Shutdown: liberar recursos


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": str(exc)})

app.include_router(auth.router,        prefix="/auth",         tags=["auth"])
app.include_router(manuscritos.router, prefix="/manuscritos",  tags=["manuscritos"])
app.include_router(capitulos.router,   prefix="/manuscritos",  tags=["capitulos"])
app.include_router(grafo.router,       prefix="/grafo",        tags=["grafo"])
app.include_router(canon.router,       prefix="/canon",        tags=["canon"])
app.include_router(lector.router,      prefix="/lector",       tags=["lector"])
app.include_router(pagos.router,       prefix="/pagos",        tags=["pagos"])
app.include_router(ia.router,          prefix="/ia",           tags=["ia"])
app.include_router(ws_router,          prefix="/ws",           tags=["websockets"])


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/tareas/{task_id}")
async def estado_tarea(task_id: str):
    from app.tasks.celery_app import celery
    from celery.result import AsyncResult
    result = AsyncResult(task_id, app=celery)
    estado = {"task_id": task_id, "estado": result.state, "progreso": 0, "mensaje": ""}
    if result.state == "PROGRESS":
        info = result.info or {}
        estado.update({
            "progreso": info.get("progreso", 0),
            "mensaje":  info.get("mensaje", ""),
            "datos":    {k: v for k, v in info.items() if k not in ("progreso", "mensaje")},
        })
    elif result.state == "SUCCESS":
        estado.update({"progreso": 100, "mensaje": "Completado", "datos": result.result or {}})
    elif result.state == "FAILURE":
        estado.update({"mensaje": str(result.info), "error": True})
    return estado
