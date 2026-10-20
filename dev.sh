#!/usr/bin/env bash
# Inicia todos los servicios de desarrollo: Redis, Backend, Celery y Frontend.
# Uso: ./dev.sh
#      ./dev.sh stop   <- mata todo lo que levantó

BACKEND_DIR="$(cd "$(dirname "$0")/backend" && pwd)"
FRONTEND_DIR="$(cd "$(dirname "$0")/frontend" && pwd)"
VENV="$BACKEND_DIR/venv/bin/activate"
PID_FILE="/tmp/novela_dev.pids"

# ── colores ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; RESET='\033[0m'

log()  { echo -e "${CYAN}[dev]${RESET} $*"; }
ok()   { echo -e "${GREEN}[ok]${RESET}  $*"; }
warn() { echo -e "${YELLOW}[!]${RESET}   $*"; }
err()  { echo -e "${RED}[err]${RESET} $*"; }

# ── stop ───────────────────────────────────────────────────────────────────────
if [[ "$1" == "stop" ]]; then
    if [[ ! -f "$PID_FILE" ]]; then
        warn "No se encontró $PID_FILE — nada que detener."
        exit 0
    fi
    log "Deteniendo servicios..."
    while IFS= read -r pid; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" && ok "PID $pid detenido"
        fi
    done < "$PID_FILE"
    rm -f "$PID_FILE"
    ok "Listo."
    exit 0
fi

# ── verificaciones previas ─────────────────────────────────────────────────────
if [[ ! -f "$VENV" ]]; then
    err "Virtualenv no encontrado en $VENV"
    err "Crea el entorno con: python -m venv $BACKEND_DIR/venv && source $VENV && pip install -r $BACKEND_DIR/requirements.txt"
    exit 1
fi

if [[ ! -f "$BACKEND_DIR/.env" ]]; then
    err "Falta $BACKEND_DIR/.env — cópialo desde .env.example y completa los valores."
    exit 1
fi

# Limpia PIDs viejos
rm -f "$PID_FILE"
mkdir -p /tmp/novela_logs

# ── 1. Redis ───────────────────────────────────────────────────────────────────
log "Verificando Redis..."
if docker ps --format '{{.Names}}' | grep -q "^redis$"; then
    ok "Redis ya está corriendo (contenedor 'redis')"
elif docker ps -a --format '{{.Names}}' | grep -q "^redis$"; then
    log "Iniciando contenedor Redis existente..."
    docker start redis > /dev/null
    ok "Redis iniciado"
else
    log "Levantando Redis con Docker..."
    docker run -d --name redis -p 6379:6379 redis:7-alpine > /dev/null
    ok "Redis levantado"
fi

# ── 2. Backend (FastAPI + uvicorn) ─────────────────────────────────────────────
log "Iniciando Backend  →  http://localhost:8000"
(
    source "$VENV"
    cd "$BACKEND_DIR"
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload \
        > /tmp/novela_logs/backend.log 2>&1
) &
BACKEND_PID=$!
echo "$BACKEND_PID" >> "$PID_FILE"
ok "Backend PID $BACKEND_PID  (log: /tmp/novela_logs/backend.log)"

# ── 3. Celery worker ───────────────────────────────────────────────────────────
log "Iniciando Celery worker..."
(
    source "$VENV"
    cd "$BACKEND_DIR"
    celery -A celery_worker.celery worker --loglevel=info --concurrency=2 \
        > /tmp/novela_logs/celery.log 2>&1
) &
CELERY_PID=$!
echo "$CELERY_PID" >> "$PID_FILE"
ok "Celery  PID $CELERY_PID  (log: /tmp/novela_logs/celery.log)"

# ── 4. Frontend (Next.js) ──────────────────────────────────────────────────────
log "Iniciando Frontend →  http://localhost:3000"
(
    cd "$FRONTEND_DIR"
    npm run dev > /tmp/novela_logs/frontend.log 2>&1
) &
FRONTEND_PID=$!
echo "$FRONTEND_PID" >> "$PID_FILE"
ok "Frontend PID $FRONTEND_PID  (log: /tmp/novela_logs/frontend.log)"

# ── resumen ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  Frontend  →  ${CYAN}http://localhost:3000${RESET}"
echo -e "  Backend   →  ${CYAN}http://localhost:8000${RESET}"
echo -e "  API docs  →  ${CYAN}http://localhost:8000/docs${RESET}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "  Logs en tiempo real:"
echo -e "    Backend : ${YELLOW}tail -f /tmp/novela_logs/backend.log${RESET}"
echo -e "    Celery  : ${YELLOW}tail -f /tmp/novela_logs/celery.log${RESET}"
echo -e "    Frontend: ${YELLOW}tail -f /tmp/novela_logs/frontend.log${RESET}"
echo ""
echo -e "  Para detener todo: ${RED}./dev.sh stop${RESET}"
echo ""

# Espera a que algún proceso muera (Ctrl+C detiene el script pero no los hijos)
wait
