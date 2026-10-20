# novela.app

Plataforma de escritura y lectura inmersiva con IA. El escritor construye su universo narrativo; el lector lo explora. La IA conecta ambos lados.

> Nombre interno en desarrollo: **Inkverse**

---

## Qué es

Una plataforma B2C para escritores hispanohablantes que publican novelas largas (romance, fantasía, sci-fi, thriller) y sus lectores.

**Diferenciador central:** las herramientas existentes son solo de escritura (Sudowrite) o solo de lectura (Wattpad, Kindle). Esta plataforma hace ambas cosas — y la IA las conecta a través de un grafo de personajes y lore compartido.

---

## Stack

### Backend (`/backend`)

| Capa | Tecnología |
|---|---|
| Framework | FastAPI 0.115 + Uvicorn |
| ORM / DB | SQLAlchemy async + PostgreSQL (Supabase) |
| Migraciones | Alembic |
| Auth | JWT (python-jose + bcrypt) |
| Cola de tareas | Celery 5 + Redis |
| NER (anonimización) | spaCy `es_core_news_lg` |
| IA | Gemini API (google-genai) + Groq |
| Embeddings | nomic-embed-text via Ollama (local) |
| Vector DB | ChromaDB |
| Encriptación | AES-256-GCM (`cryptography`) + Argon2id (`argon2-cffi`) |
| Docs | PyMuPDF (PDF) + python-docx (DOCX) |
| Pagos | Stripe + MercadoPago (pendiente) |

### Frontend (`/frontend`)

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS |
| Grafo visual | (pendiente: Cytoscape.js) |
| WebSockets | nativo del browser |

---

## Estructura del proyecto

```
/
├── backend/
│   ├── app/
│   │   ├── main.py              # entry point FastAPI
│   │   ├── config.py            # settings via pydantic-settings
│   │   ├── database.py          # engine async SQLAlchemy
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── routers/             # endpoints por dominio
│   │   │   ├── auth.py
│   │   │   ├── manuscritos.py
│   │   │   ├── capitulos.py
│   │   │   ├── grafo.py
│   │   │   ├── canon.py
│   │   │   ├── lector.py
│   │   │   ├── pagos.py
│   │   │   └── ia.py
│   │   ├── services/            # lógica de negocio
│   │   │   ├── anonimizador.py
│   │   │   ├── embedding_service.py
│   │   │   ├── extractor_entidades.py
│   │   │   ├── extractor_relaciones.py
│   │   │   ├── grafo_service.py
│   │   │   ├── canon_service.py
│   │   │   ├── contradiccion_service.py
│   │   │   ├── encriptacion_service.py
│   │   │   └── ...
│   │   ├── agents/              # agentes IA
│   │   ├── tasks/               # tareas Celery
│   │   └── websockets/          # WS de progreso
│   ├── migrations/              # Alembic
│   ├── tests/
│   ├── requirements.txt
│   ├── alembic.ini
│   └── .env.example
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/              # login, registro
│   │   ├── (escritor)/          # dashboard, editor, manuscritos, grafo
│   │   ├── (lector)/            # explorar, biblioteca, novela, leer
│   │   └── api/                 # route handlers Next.js (webhooks)
│   ├── components/
│   │   ├── escritor/            # Editor, CanonPanel, ChatIA, ...
│   │   ├── grafo/               # GrafoCanvas, FiltroGrafo, ...
│   │   ├── lector/              # VistaInmersiva, GrafoLector, ...
│   │   └── ui/                  # Button, Modal, Spinner, ...
│   ├── hooks/
│   ├── lib/                     # clientes API, auth helpers
│   ├── types/
│   └── .env.example
│
├── docker-compose.yml
├── dev.sh
└── .gitignore
```

---

## Qué funciona hoy

### Backend
- Autenticación completa: registro, login, JWT, refresh
- CRUD de manuscritos (crear, listar, detalle, eliminar)
- CRUD de capítulos con versionado básico
- Pipeline de procesamiento de capítulos (Celery async):
  - Extracción de texto desde TXT, DOCX y PDF
  - Anonimización con spaCy NER (`[CHAR_A]`, `[LOC_A]`, ...)
  - Generación de embeddings con nomic-embed-text (Ollama local)
  - Almacenamiento en ChromaDB
- Extracción de entidades y relaciones vía Gemini API (texto anonimizado)
- Grafo de personajes: nodos y aristas en PostgreSQL
- Canon: registro de hechos narrativos con sistema de prioridades y supersesión
- Detector de contradicciones entre capítulos
- Sistema de progreso de lectura por lector
- WebSocket de progreso en tiempo real (`/ws/progreso/{manuscript_id}`)
- Encriptación envelope (AES-256-GCM + Argon2id): infraestructura completa, pendiente de integrar al flujo principal
- Endpoint de salud: `GET /health`
- Endpoint de estado de tarea Celery: `GET /tareas/{task_id}`

### Frontend
- Rutas y layouts definidos para escritor y lector
- Páginas de autenticación (login, registro)
- Dashboard del escritor
- Listado de manuscritos y detalle
- Editor de capítulos (estructura base)
- Vista del grafo (estructura base, visualización pendiente)
- Vista de canon
- Analytics de manuscrito (estructura base)
- Explorar novelas, biblioteca del lector
- Vista de lectura inmersiva (estructura base)
- Vista del grafo para lector con niebla de guerra (estructura base)
- Componentes UI propios: Button, Modal, Badge, Spinner, EmptyState
- Hooks: `useAuth`, `useGrafo`, `useCanonReview`, `useProcesamientoWS`
- Cliente API centralizado en `lib/api.ts`

---

## Qué está pendiente

### Alta prioridad (MVP)
- [ ] Conectar el editor de capítulos al pipeline de procesamiento (subir texto → extraer → grafo)
- [ ] Renderizar el grafo con Cytoscape.js en `GrafoCanvas.tsx`
- [ ] Niebla de guerra funcional: bloquear nodos del grafo por capítulo leído
- [ ] Chat con el agente: pregunta → búsqueda en ChromaDB → Gemini → respuesta remapeada
- [ ] Integrar encriptación envelope al flujo completo de guardado/carga
- [ ] Tests de integración para el pipeline de procesamiento
- [ ] Página de lectura funcional con grafo al lado

### Media prioridad (post-MVP)
- [ ] Curva emocional del manuscrito (tensión por capítulo)
- [ ] Alerta en tiempo real al escribir (incoherencia con lore)
- [ ] Fichas de personaje sin spoilers para lector
- [ ] UI adaptativa al tono de la escena (colores, efectos CSS)
- [ ] Sonido ambiental por género (loops cortos via Web Audio API)
- [ ] Historial de versiones de capítulos (diffs, recuperar versión anterior)
- [ ] Anotaciones de lectores por pasaje

### Baja prioridad (V2+)
- [ ] Pagos con Stripe / MercadoPago
- [ ] Voces por personaje (ElevenLabs o Kokoro-TTS)
- [ ] Clubes de lectura sincronizados
- [ ] Teorías de fans con fact-checking automático
- [ ] Coautoría y universos compartidos
- [ ] App móvil (React Native)

---

## Cómo levantar el proyecto en local

### Requisitos previos

- Python 3.12+
- Node.js 20+
- Docker y Docker Compose
- [Ollama](https://ollama.com) instalado y corriendo
- Cuenta en [Supabase](https://supabase.com) (o PostgreSQL local)
- API key de [Gemini](https://aistudio.google.com)

### 1. Clonar el repo

```bash
git clone https://github.com/KarlaBedregal/novela.app.git
cd novela.app
```

### 2. Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Descargar modelo de spaCy
python -m spacy download es_core_news_lg

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales (DATABASE_URL, GEMINI_API_KEY, etc.)

# Correr migraciones
alembic upgrade head

# Levantar el servidor
uvicorn app.main:app --reload --port 8000
```

### 3. Ollama (embeddings locales)

```bash
# En otra terminal
ollama pull nomic-embed-text
ollama serve
```

### 4. Redis (necesario para Celery)

```bash
# Con Docker
docker run -d -p 6379:6379 redis:7-alpine

# O con docker-compose (levanta todo junto — ver paso 6)
```

### 5. Worker de Celery

```bash
# En otra terminal, desde /backend con el venv activado
celery -A celery_worker.celery worker --loglevel=info --concurrency=2
```

### 6. Frontend

```bash
cd frontend

npm install

cp .env.example .env.local
# .env.local ya apunta a http://localhost:8000 por defecto

npm run dev
# Disponible en http://localhost:3000
```

### Alternativa: levantar todo con Docker Compose

```bash
# Desde la raíz del proyecto
docker compose up --build
```

Servicios que levanta:
- `backend` en `http://localhost:8000`
- `frontend` en `http://localhost:3000`
- `celery_worker`
- `redis` en `localhost:6379`

> Nota: Ollama debe correr fuera de Docker (en el host) para acceder a la GPU local. Apuntar `OLLAMA_HOST=http://host.docker.internal:11434` en el `.env` del backend.

---

## Variables de entorno

### Backend (`backend/.env`)

| Variable | Descripción |
|---|---|
| `SECRET_KEY` | Clave secreta JWT (generada con `openssl rand -hex 32`) |
| `DEBUG` | `True` en desarrollo, `False` en producción |
| `DATABASE_URL` | Connection string PostgreSQL async (`postgresql+asyncpg://...`) |
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_KEY` | Service role key de Supabase |
| `REDIS_URL` | `redis://localhost:6379/0` |
| `CELERY_BROKER_URL` | `redis://localhost:6379/0` |
| `CELERY_RESULT_BACKEND` | `redis://localhost:6379/1` |
| `GEMINI_API_KEY` | API key de Google AI Studio |
| `OLLAMA_HOST` | `http://localhost:11434` |
| `EMBEDDING_MODEL` | `nomic-embed-text` |
| `CHROMA_PERSIST_DIR` | `./chroma_data` |
| `STRIPE_SECRET_KEY` | (dejar vacío en MVP) |
| `MP_ACCESS_TOKEN` | (dejar vacío en MVP) |

### Frontend (`frontend/.env.local`)

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL del backend: `http://localhost:8000` |
| `NEXT_PUBLIC_WS_URL` | WebSocket del backend: `ws://localhost:8000` |

---

## API — endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Estado del servidor |
| `POST` | `/auth/register` | Crear cuenta |
| `POST` | `/auth/login` | Login, retorna JWT |
| `GET` | `/manuscritos` | Listar manuscritos del usuario |
| `POST` | `/manuscritos` | Crear manuscrito |
| `GET` | `/manuscritos/{id}/capitulos` | Listar capítulos |
| `POST` | `/manuscritos/{id}/capitulos` | Crear capítulo + trigger procesamiento |
| `GET` | `/grafo/{manuscrito_id}` | Grafo de personajes completo |
| `GET` | `/canon/{manuscrito_id}` | Entradas del canon |
| `POST` | `/ia/chat` | Chat con el agente del universo |
| `GET` | `/tareas/{task_id}` | Estado de tarea Celery |
| `WS` | `/ws/progreso/{manuscrito_id}` | Progreso de procesamiento en tiempo real |

Documentación interactiva disponible en `http://localhost:8000/docs` (Swagger UI).

---

## Deploy

### Backend — Railway o Render

1. Conectar el repositorio en [Railway](https://railway.app) o [Render](https://render.com)
2. Configurar las variables de entorno del `.env.example`
3. Agregar un servicio Redis (Railway lo tiene nativo)
4. El comando de inicio es `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Para el worker Celery: segundo servicio con `celery -A celery_worker.celery worker --loglevel=info`

> Para producción, ChromaDB y los embeddings deben persistir en un volumen. Railway soporta volúmenes persistentes.

### Frontend — Vercel

```bash
# Instalar CLI de Vercel
npm i -g vercel

cd frontend
vercel
```

Configurar `NEXT_PUBLIC_API_URL` y `NEXT_PUBLIC_WS_URL` en el dashboard de Vercel apuntando a la URL de Railway/Render.

---

## Fases de desarrollo

| Fase | Estado | Descripción |
|---|---|---|
| **MVP** | En progreso | Pipeline completo + grafo + chat con agente |
| **V1** | Planificado | Encriptación envelope + features escritor + lector inmersivo |
| **V2** | Planificado | Social (clubes, teorías, anotaciones) + pagos |
| **V3** | Futuro | App móvil + colaboración + internacionalización |

Fecha estimada MVP funcional: **noviembre 2026**

---

## Licencia

Privado. Todos los derechos reservados.
