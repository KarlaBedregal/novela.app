# Estructura Completa del Proyecto — Inkverse

> Documento maestro del proyecto. Referencia y sintetiza todos los documentos de detalle.
> Última actualización: octubre 2026

---

## 0. Identidad del producto

| Campo | Valor |
|---|---|
| **Nombre** | Inkverse *(o Trama — ver nombres propuestos en proyecto_novela.md)* |
| **Tagline** | "El universo de tu novela, vivo." |
| **Categoría** | Plataforma de escritura y lectura inmersiva con IA |
| **Modelo** | B2B2C — escritores traen su propia audiencia |
| **Mercado inicial** | Escritores hispanohablantes (Latinoamérica) |
| **Idioma** | Español (internacionalización en V3+) |

**Visión:** Una plataforma donde el escritor construye su universo y el lector lo explora, con la IA como puente entre ambos.

**Misión:** Dar a los escritores de ficción herramientas de IA que antes solo tenían estudios editoriales grandes, y a los lectores una experiencia de inmersión que ningún epub puede ofrecer.

**Diferenciador central:** Ninguna app actual une escritor y lector en el mismo ecosistema. Sudowrite escribe pero no publica. Wattpad publica pero no tiene IA de escritura. Kindle es lectura pasiva. Inkverse hace todo — y la IA conecta los dos lados.

---

## 1. Públicos objetivo

### Escritor ideal (ICP — Ideal Customer Profile)

| Criterio | Descripción |
|---|---|
| Volumen | Escribe novelas largas (30K+ palabras) o series |
| Canal actual | Publica o interactúa en Wattpad, Instagram, Twitter, AO3 |
| Dolor actual | Ha tenido inconsistencias en sus manuscritos, pierde el hilo de personajes |
| Hábito de pago | Ya paga por herramientas (Sudowrite $10/mes, Notion, Canva) |
| Audiencia propia | Tiene seguidores que lo seguirían a una nueva plataforma |
| Género | Romance, fantasía, ciencia ficción, thriller (géneros con fandoms activos) |

### Lector ideal

| Criterio | Descripción |
|---|---|
| Frecuencia | Lee 1+ novela al mes |
| Comportamiento | Sigue a escritores en redes sociales, participa en fandoms |
| Hábito de pago | Ha pagado por contenido digital (Kindle, Patreon, capítulos premium en Wattpad) |
| Motivación | Quiere conectar más profundamente con los universos que le gustan |

---

## 2. Propuesta de valor por público

### Para el escritor

```
SIN Inkverse                          CON Inkverse
────────────────────────────────      ──────────────────────────────────
Busca inconsistencias leyendo         El agente las detecta automáticamente
todo de nuevo manualmente

Mantiene fichas en Notion/Excel       Grafo de personajes construido del texto

No sabe cómo experimentan             Analytics: heatmap de lectores, abandono,
sus lectores la historia              curva emocional real vs. esperada

No tiene herramienta para             "Escribe desde este POV", completado
escribir coherente con el lore        coherente con el universo ya establecido

Publica en plataformas que            Publica donde sus lectores tienen
no conocen su universo                experiencia inmersiva en el mismo lore
```

### Para el lector

```
SIN Inkverse                          CON Inkverse
────────────────────────────────      ──────────────────────────────────
Lee texto plano en epub/PDF           UI inmersiva que cambia con el tono de escena

Confunde personajes en                Grafo con niebla de guerra: solo lo que ya
series largas                         leyó, sin spoilers

Solo ve lo que el personaje           "Entrar a la mente": la IA reescribe el pasaje
muestra externamente                  desde adentro del personaje

No sabe si su teoría tiene            Agente verifica la teoría contra el texto:
sentido                               "consistente / contradice en cap 3"
```

---

## 3. Funcionalidades por fase

### Fase 0 — Validación (2 semanas, antes del código)

- [ ] Landing page con waitlist y propuesta de valor
- [ ] Encuesta a 30 escritores/lectores reales
- [ ] Extractor de personajes básico (prototipo en terminal, sin frontend)
- [ ] Decisión: ¿hay suficiente interés para construir el MVP?

---

### MVP (8 semanas) — Solo escritores, herramienta privada

**Pipeline de ingesta:**
- [ ] Subir manuscrito (TXT, DOCX, PDF)
- [ ] Extractor de texto por formato
- [ ] Anonimizador: spaCy NER → Elena → [CHAR_A]
- [ ] Chunker con solapamiento (~500 tokens por chunk)
- [ ] Embeddings locales: nomic-embed-text via Ollama → ChromaDB
- [ ] Cola asíncrona: Celery + Redis para procesar sin bloquear UI

**Grafo de personajes:**
- [ ] Agente extractor de relaciones (Gemini API + texto anonimizado)
- [ ] Re-mapeo: [CHAR_A] → Elena antes de guardar
- [ ] Esquema en PostgreSQL: tabla nodos, tabla aristas, metadatos
- [ ] Visualización: Cytoscape.js en Next.js
- [ ] Niebla de guerra: parámetro `hasta_capitulo` filtra nodos
- [ ] Corrección del grafo mediada por IA (sin edición directa)
- [ ] Procesamiento diferencial para capítulos actualizados
- [ ] Historial de versiones por capítulo (diffs, no copias completas)

**Modo escritor + chat:**
- [ ] Auth con Supabase (login/registro)
- [ ] Dashboard: lista de manuscritos del usuario
- [ ] Lector básico: texto formateado + grafo al lado
- [ ] Chat: pregunta → ChromaDB → fragmento anonimizado → API → respuesta re-mapeada
- [ ] Detector de contradicciones básico
- [ ] Procesamiento cap por cap con feedback en tiempo real (WebSocket)

**Deploy:**
- [ ] Railway (backend FastAPI + Celery + Redis)
- [ ] Vercel (frontend Next.js)
- [ ] Supabase (PostgreSQL + Auth + Storage)

**Monetización activa:** Ninguna (app gratis para los primeros 20 usuarios)

---

### V1 (8 semanas adicionales) — Publicación + lectores + primeros pagos

**Seguridad:**
- [ ] Envelope encryption: Argon2id + AES-256-GCM por manuscrito
- [ ] Sesiones seguras: DEK en Redis con TTL, nunca en disco
- [ ] Sistema de recuperación: 3 frases personales (basta con recordar 1)
- [ ] Migrar almacenamiento a encriptado (manuscritos + embeddings + mapas)

**Features del escritor:**
- [ ] Curva emocional del manuscrito (tensión/alivio por capítulo)
- [ ] ADN narrativo: análisis de estilo, ritmo, densidad de vocabulario
- [ ] Análisis de pacing e identificación de tramos lentos
- [ ] Alerta en tiempo real al escribir (coherencia con el lore)
- [ ] Rastreador de tramas abiertas (subtramas sin resolver)
- [ ] Perfil de personaje generado automáticamente desde el texto

**Experiencia del lector:**
- [ ] UI inmersiva por género (paleta, fuente, efectos, sonido ambiental)
- [ ] Ajuste dinámico por tono de escena (V1.5: CSS + Web Audio API)
- [ ] "Entrar a la mente" de un personaje
- [ ] Fichas de personaje sin spoilers (solo lo leído hasta ese punto)
- [ ] Comentarios del autor desbloqueables por capítulo
- [ ] Anotaciones del lector (locales, sincronizadas en V2)
- [ ] Predicciones antes de cada capítulo

**Publicación:**
- [ ] El escritor invita lectores por link directo (sin marketplace aún)
- [ ] Moderación por niveles: General / Maduro / Adulto
- [ ] El escritor etiqueta el contenido al publicar (warnings)
- [ ] Botón de reporte básico

**Monetización:**
- [ ] Stripe Billing: suscripciones de escritores (Explorador gratis / Creador ~$8 / Estudio ~$18)
- [ ] Webhook FastAPI para eventos de Stripe
- [ ] MercadoPago como alternativa de pago (LATAM sin tarjeta)
- [ ] Portal de facturación del cliente (Stripe Customer Portal)

---

### V2 (3-4 meses adicionales) — Marketplace público + crecimiento

**Discovery pública:**
- [ ] Catálogo navegable de obras publicadas
- [ ] Búsqueda semántica entre obras
- [ ] Categorías por género y tags
- [ ] Perfil público de escritor

**Monetización del escritor:**
- [ ] Stripe Connect: escritores conectan su cuenta bancaria
- [ ] Capítulos de acceso anticipado (lectores pagan para leer antes)
- [ ] Propinas de lectores
- [ ] Suscripción directa del escritor a sus lectores
- [ ] Comisiones automáticas: 15% capítulos, 10% propinas, 12% suscripciones

**Lector Premium (~$4/mes):**
- [ ] Anotaciones sincronizadas en la nube entre dispositivos
- [ ] Capítulos anticipados (si el autor los activa)
- [ ] Personalización avanzada del tema visual
- [ ] Sin anuncios (cuando los haya)

**Social:**
- [ ] Clubes de lectura sincronizados (mismo ritmo, chat protegido por spoilers)
- [ ] Teorías de fans con fact-checking automático del agente
- [ ] Reacciones por pasaje (escritor ve mapa de impacto emocional)
- [ ] Anotaciones de fans verificados

**Analytics avanzado para escritores (tier Estudio):**
- [ ] Heatmap: dónde aceleran / pausan / abandonan los lectores
- [ ] Puntos de abandono por capítulo
- [ ] Comparación curva emocional esperada vs. real
- [ ] Exportar grafo en JSON y PNG

**Moderación V2:**
- [ ] Dashboard de moderación (backoffice interno)
- [ ] Sistema de reportes con categorías y estado
- [ ] Para contenido adulto: verificación de edad (no KYC, pero gate real)
- [ ] Sistema de apelaciones
- [ ] DMCA Designated Agent nombrado

---

### Backlog / V3+

- Aplicación móvil (React Native + Expo)
- Modo colaborativo: múltiples autores en el mismo universo
- Música generativa adaptativa (requiere GPU o API musical)
- Voces por personaje (ElevenLabs o Kokoro-TTS local)
- Mapa del mundo interactivo (creado por escritor, revelado al lector)
- Reconstrucción espacial de escenas (diagrama de posición de personajes)
- Escenas alternativas ("¿Qué si?") marcadas como no-canon
- Contribuciones de la comunidad al canon del autor
- API pública para integraciones externas
- Internacionalización (inglés, portugués)
- Precios regionales diferenciados (LATAM vs. internacional)

---

## 4. Arquitectura técnica

### Stack completo

| Capa | Tecnología | Por qué |
|---|---|---|
| **Frontend web** | Next.js 16 + App Router | Ya lo manejas (MIST) |
| **Estilos** | TailwindCSS + Framer Motion | Rápido + animaciones de UI |
| **Grafo visual** | Cytoscape.js | Mejor para grafos grandes que D3.js |
| **WebSockets frontend** | Socket.io (cliente) | Progreso en tiempo real |
| **Backend** | FastAPI (Python) | Ya lo dominas, rápido para IA |
| **Cola de tareas** | Celery + Redis | Procesamiento asíncrono de manuscritos |
| **WebSockets backend** | FastAPI WebSockets | Notificaciones al frontend |
| **Base de datos** | Supabase (PostgreSQL) | Ya lo usas en YachAI |
| **Auth** | Supabase Auth | Ya viene integrado |
| **Storage** | Supabase Storage | Archivos subidos por usuarios |
| **Sesiones seguras** | Redis con TTL | DEK en memoria, no en disco (V1) |
| **NER** | spaCy `es_core_news_lg` | Anonimizador de nombres en español |
| **Embedding model** | `nomic-embed-text` via Ollama | Local, sin API key, CPU ok |
| **Vector DB** | ChromaDB | Simple, local, Python-nativo |
| **Grafo en DB** | NetworkX + PostgreSQL | Para MVP; migrable a Neo4j después |
| **Extracción relaciones** | Gemini API (texto anonimizado) | Gratis para prototipar |
| **IA principal** | Gemini API → Claude API | Gemini gratis al inicio; Claude cuando haya presupuesto |
| **Encriptación** | `cryptography` (AES-256-GCM) | Estándar de la industria (V1) |
| **Derivación de clave** | `argon2-cffi` | Argon2id: lento por diseño, resistente a ataques |
| **Extracción de texto** | `pymupdf` (PDF) + `python-docx` (DOCX) | Formatos más comunes |
| **Deploy backend** | Railway | Simple, soporta Celery + Redis |
| **Deploy frontend** | Vercel | Integrado con Next.js |
| **CDN / Storage** | Cloudflare R2 (V1+) | Barato para almacenamiento de archivos grandes |
| **Analytics** | PostHog (open source) | Heatmaps, eventos, sin costo inicial |
| **Pagos** | Stripe Billing + Stripe Connect + MercadoPago | Ver sección 6 |
| **Moderación IA (V2)** | Perspective API | Detección de texto dañino a escala |

---

### Diagrama de componentes

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USUARIO (navegador)                          │
│  Next.js 16 App                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Editor       │  │ Grafo        │  │ Modo Lector              │  │
│  │ manuscrito   │  │ Cytoscape.js │  │ UI inmersiva + chat      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────────┘  │
│         │                 │                       │                  │
└─────────┼─────────────────┼───────────────────────┼──────────────────┘
          │ HTTPS           │ WebSocket             │ HTTPS
          ▼                 ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         TUS SERVIDORES                               │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  FastAPI — API REST + WebSockets                              │  │
│  │  Endpoints: /upload  /chat  /graph  /versions  /stripe        │  │
│  └─────────┬────────────────────┬──────────────────┬─────────────┘  │
│            │                    │                  │                 │
│            ▼                    ▼                  ▼                 │
│  ┌──────────────┐    ┌────────────────┐   ┌────────────────────┐   │
│  │ Celery       │    │ Supabase       │   │ Redis              │   │
│  │ Workers      │    │ PostgreSQL     │   │ Cola de tareas     │   │
│  │              │    │ - usuarios     │   │ + DEK de sesión    │   │
│  │ Pipeline:    │    │ - manuscritos  │   │ (TTL corto)        │   │
│  │ 1. spaCy NER │    │ - grafo nodos  │   └────────────────────┘   │
│  │ 2. anonimizar│    │ - grafo aristas│                             │
│  │ 3. chunking  │    │ - versiones    │                             │
│  │ 4. embed     │    │ - suscripciones│                             │
│  │ 5. grafo     │    └────────────────┘                             │
│  └──────┬───────┘                                                   │
│         │                                                            │
│         ▼                                                            │
│  ┌──────────────┐    ┌────────────────┐                             │
│  │ ChromaDB     │    │ Ollama local   │                             │
│  │ (vectores    │    │ nomic-embed    │                             │
│  │  encriptados │    │ -text          │                             │
│  │  en V1)      │    │ (sin API key)  │                             │
│  └──────────────┘    └────────────────┘                             │
│                                                                      │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ Solo fragmentos anonimizados (~500 tokens)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  API EXTERNA (Gemini o Claude)                                       │
│  Ve: "[CHAR_A] descubrió que [CHAR_B] era su hermano"               │
│  NO ve: nombres reales, manuscrito completo, nada identificable      │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Pipeline de privacidad (las 3 fases)

```
MVP:  Anonimización (spaCy) + Embeddings locales (Ollama) + API solo ve tokens
V1:   + Envelope Encryption (Argon2id + AES-256-GCM) — servidor no puede leer nada
V2+:  Self-hosted completo (solo si la escala justifica el costo de GPU)
```

*Ver detalle completo en `plan_tecnico.md`*

---

## 5. Modelo de datos (entidades principales)

```
USUARIO
  id, email, nombre, stripe_customer_id
  subscription_status, subscription_tier, current_period_end
  stripe_connect_account_id (V2, para escritores que reciben pagos)
  created_at

MANUSCRITO
  id, usuario_id, titulo, genero, nivel_contenido
  estado (borrador / procesando / procesado / publicado)
  encriptado (bool), dek_encriptada (bytes, V1)
  configuracion_inmersiva (JSON: tema, paleta, sonido)
  created_at, updated_at

CAPITULO
  id, manuscrito_id, numero, titulo
  texto_encriptado, texto_anonimizado
  version_actual, total_palabras
  estado_procesamiento
  creado_at, actualizado_at

VERSION_CAPITULO
  id, capitulo_id, numero_version
  diff (JSON: cambios respecto a versión anterior)
  created_at

NODO_GRAFO
  id, manuscrito_id, tipo (personaje / lugar / objeto / evento)
  nombre, nombre_anonimizado, descripcion
  primer_cap_aparicion, ultimo_cap_aparicion
  metadatos (JSON: apodos, atributos físicos, etc.)
  estado (suggestion / canon / draft / ambiguous / contradictory / superseded)
  -- suggestion: extraído por IA, pendiente de validación del autor
  -- canon: verdad confirmada del universo
  -- draft: el autor lo planea pero aún no está escrito
  -- ambiguous: aparece en el texto pero su interpretación es incierta
  -- contradictory: conflicto real detectado entre capítulos
  -- superseded: fue canon, reemplazado por evolución narrativa posterior
  fuente_primera_mencion TEXT  -- fragmento exacto del texto que justificó la extracción
  cap_fuente_id            -- capítulo donde apareció por primera vez
  pos_inicio, pos_fin      -- posición exacta de caracteres dentro del capítulo
  prioridad CHAR(1)        -- S / A / B / C (para context priority al construir prompts)

ARISTA_GRAFO
  id, manuscrito_id, nodo_origen_id, nodo_destino_id
  tipo_relacion, descripcion
  cap_inicio, cap_fin           -- rango de capítulos en que la relación es válida
  estado (suggestion / canon / draft / ambiguous / contradictory / superseded)
  fuente_texto TEXT             -- fragmento exacto del texto que justificó la extracción
  cap_fuente_id, pos_inicio, pos_fin
  supersedida_por_id            -- FK → arista_grafo.id; null si la relación sigue activa
  prioridad CHAR(1)             -- S / A / B / C

CANON_EVENTOS  -- audit trail append-only: nunca se borra, solo se agregan filas
  id, manuscrito_id
  tipo_evento (extraccion_ia / confirmacion_autor / rechazo_autor / correccion /
               marcado_contradictorio / supersesion)
  entidad_tipo (nodo / arista), entidad_id
  estado_anterior, estado_nuevo
  descripcion TEXT              -- qué cambió y por qué (texto del autor o log del agente)
  realizado_por (ia / autor)
  created_at

CHUNK_EMBEDDING
  id, manuscrito_id, capitulo_id
  texto_anonimizado, posicion, longitud_tokens
  vector (almacenado en ChromaDB, referenciado por id)
  encriptado (bool, V1)

LECTOR_PROGRESO
  id, usuario_id, manuscrito_id
  ultimo_capitulo_leido, ultimo_parrafo_leido
  fecha_inicio, fecha_ultima_lectura

ANOTACION_LECTOR
  id, usuario_id, manuscrito_id, capitulo_id
  parrafo_inicio, parrafo_fin
  texto_anotacion, version_capitulo_al_anotar
  created_at

REPORTE_CONTENIDO
  id, manuscrito_id, capitulo_id
  reportado_por, categoria, descripcion
  estado (pendiente / revisado / resuelto / rechazado)
  created_at

TRANSACCION (V2)
  id, manuscrito_id, lector_id, escritor_id
  tipo (capitulo / propina / suscripcion_directa)
  monto_total, monto_escritor, monto_plataforma
  stripe_payment_intent_id, estado
  created_at
```

---

## 6. Sistema de pagos

### Stack de pagos

| Herramienta | Para qué | Cuándo |
|---|---|---|
| **Stripe Billing** | Suscripciones de escritores (cobro mensual automático) | V1 |
| **Stripe Connect** | Payouts automáticos a escritores (split de comisiones) | V2 |
| **Stripe Checkout** | Página de pago lista sin construir formulario propio | V1 |
| **Stripe Customer Portal** | El escritor gestiona su suscripción directamente | V1 |
| **Stripe Tax** | Manejo automático de impuestos por región | V2+ |
| **MercadoPago** | Alternativa de pago para usuarios sin tarjeta internacional | V1 complementario |

### Flujos de dinero

```
FLUJO 1 — Suscripción de escritor (V1)
  Escritor → Stripe Billing → Tu cuenta
  Webhook: subscription.created / invoice.payment_succeeded

FLUJO 2 — Comisión por capítulo pagado (V2)
  Lector → Stripe Connect → Split automático
    85% → cuenta del escritor (en su banco, sin intermediario manual)
    15% → tu cuenta (comisión de plataforma)

FLUJO 3 — Propina (V2)
  Lector → Stripe Connect → Split
    90% → escritor / 10% → plataforma

FLUJO 4 — Suscripción del escritor a sus lectores (V2)
  Lector → Stripe Connect → Split
    88% → escritor / 12% → plataforma
```

### Integración técnica (FastAPI)

```python
# Crear sesión de checkout para suscripción
session = stripe.checkout.Session.create(
    customer_email=user.email,
    line_items=[{"price": PRICE_CREADOR_ID, "quantity": 1}],
    mode="subscription",
    success_url=f"{BASE_URL}/dashboard?activated=true",
    cancel_url=f"{BASE_URL}/pricing",
)

# Webhook endpoint (FastAPI)
@app.post("/stripe/webhook")
async def handle_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature")
    event = stripe.Webhook.construct_event(payload, sig, WEBHOOK_SECRET)
    
    if event["type"] == "invoice.payment_succeeded":
        # Actualizar subscription_status en Supabase
    elif event["type"] == "customer.subscription.deleted":
        # Bajar al usuario a tier Explorador
```

### Precios regionales

Stripe permite definir precios diferentes por país. Propuesta:

| Tier | Internacional (USD) | LATAM (USD equivalente) | Perú (PEN aprox.) |
|---|---|---|---|
| Creador | $8/mes | $5/mes | S/. 18/mes |
| Estudio | $18/mes | $12/mes | S/. 42/mes |
| Lector Premium (V2) | $4/mes | $2.5/mes | S/. 9/mes |

*Todos marcados como ⚠️ tentativo — validar con usuarios reales antes de fijar*

---

## 7. Moderación de contenido

### Sistema de niveles

| Nivel | Contenido permitido | Acceso | Moderación |
|---|---|---|---|
| **General** | Todo público, sin contenido adulto explícito | Todos (sin login) | Reactiva |
| **Maduro** | Violencia narrativa, temas oscuros, romance implícito, lenguaje fuerte | Registro (+18 declarado) | Reactiva |
| **Adulto** | Contenido sexual explícito, gore detallado | +18 verificado (gate real) | Reactiva + revisión en reportes |

### Contenido siempre prohibido

- Material sexual que involucre menores — eliminación inmediata + denuncia a autoridades (obligatoria legalmente)
- Doxxing o información privada real de personas identificables
- Contenido que incite a violencia real (distinguido de ficción)
- Texto copiado de otro autor sin permiso (DMCA / DL 822)
- Desinformación presentada como ficción realista sin disclaimer

### Warning tags obligatorios al publicar

El escritor etiqueta antes de publicar (el sistema lo recuerda para capítulos futuros):

`violencia` · `sangre` · `muerte de personaje principal` · `trauma/abuso` · `salud mental/suicidio` · `contenido sexual` · `lenguaje fuerte` · `horror` · `incesto` · `non-con`

### Stack técnico por fase

| Fase | Stack | Qué hace |
|---|---|---|
| MVP | Sin moderación (usuarios seleccionados, sin publicación) | — |
| V1 | Botón de reporte + email de soporte (48h SLA) | Reactivo manual |
| V2 | Dashboard de moderación interno + Perspective API | Reactivo asistido por IA |
| V3+ | Queue de moderación + sistema de apelaciones + DMCA agent | Escalable |

### DMCA / derechos de autor

- Nombrar un DMCA Designated Agent (requerido si hay usuarios de EEUU)
- Proceso: denuncia recibida → notificar al autor acusado → 48h para responder → si no responde, retirar contenido
- Para Perú: mismo proceso bajo DL 822 (Ley de Derechos de Autor)
- El manuscrito del usuario le pertenece: Inkverse solo procesa el texto para el servicio al propio usuario, no lo usa para entrenar modelos ni lo comercializa

---

## 8. Go-to-market

### ¿De qué tipo es? Marketing/ejecución (no tech)

La parte técnica de go-to-market es mínima: landing page (3 días), formulario de waitlist (1 día), analytics (1 día). Todo lo demás es ejecución de marketing y construcción de comunidad.

### Fase 0 — Beta cerrada (antes del MVP, 2 semanas)

**Meta: 20 escritores activos con feedback real**

| Acción | Cómo |
|---|---|
| Identificar escritores objetivo | Activos en Instagram/Twitter, publican en Wattpad o blog, escriben novelas largas |
| Contacto directo personalizado | Mensaje individual (no masivo): "Estoy construyendo una herramienta y busco beta testers" |
| Grupos de escritores | Facebook (hay grupos con 10K-50K miembros en español), Discord de escritura |
| Red personal | UNSA, compañeros que escriben, conocidos del medio |
| Criterio de selección | Que tengan un manuscrito real que quieran procesar (no alguien que "quizás escriba algo") |

**Ofrece a cambio:** Acceso gratuito permanente + voz directa en el desarrollo del producto.

### Fase 1 — Lanzamiento V1 (cuando MVP funciona)

| Canal | Acción |
|---|---|
| Demo pública | Hilo de Twitter o video corto (< 2 min) mostrando el grafo construyéndose en tiempo real con un libro real. No teoría — pantalla real. |
| Caso de uso real | Un beta tester habla públicamente de cómo la app le detectó una inconsistencia que no había visto. Testimonio > copy de marketing. |
| Comunidades | Post en r/escritura, grupos de Facebook, Discord de fanfic, Twitter hispanoparlante |
| Programa de referidos | Invita a un escritor → ambos tienen 1 mes de Creador gratis |
| Newsletter propia | Empezar lista de email de escritores (ConvertKit gratis hasta 1,000 suscriptores) |

### Fase 2 — Crecimiento orgánico (cuando V2 está activo)

| Canal | Acción |
|---|---|
| SEO | Artículos: "cómo evitar inconsistencias en tu novela", "herramientas de IA para escritores 2027" |
| Partnerships | Cursos de escritura creativa en LATAM (varios con miles de alumnos) |
| Creadores de contenido | 1-2 escritores con audiencia que adopten la plataforma como sus "escritores estrella" |
| PR | Aparición en newsletters de escritura, podcasts de libros en español |
| El modelo B2B2C se activa | Cada escritor que publica trae su audiencia → el marketing lo hacen los escritores, no tú |

### Métricas de go-to-market por fase

| Fase | Métrica de éxito |
|---|---|
| Fase 0 | 20 usuarios activos con feedback real |
| MVP | 50 escritores con al menos 1 manuscrito procesado |
| V1 lanzamiento | 50 escritores de pago en los primeros 3 meses |
| V2 | 30% de retención semanal de lectores |
| Escala | 20% de lectores activos convierte a Premium |

### Herramientas tech de marketing (mínimo necesario)

| Herramienta | Para qué | Costo |
|---|---|---|
| PostHog | Analytics de comportamiento, heatmaps, embudo de conversión | Gratis hasta 1M eventos |
| ConvertKit | Newsletter de escritores | Gratis hasta 1,000 suscriptores |
| Typeform | Formulario de waitlist y encuestas | Gratis (plan básico) |
| Cal.com | Agendar llamadas con beta testers | Gratis |

---

## 9. Timeline completo

```
OCT 2026   NOV 2026   DIC 2026   ENE 2027   FEB 2027   MAR 2027   ABR 2027
│          │          │          │          │          │          │
├─ FASE 0 ─┤          │          │          │          │          │
│ Landing  │          │          │          │          │          │
│ Waitlist │          │          │          │          │          │
│ Encuestas│          │          │          │          │          │
│          │          │          │          │          │          │
├──────────── MVP (8 semanas) ──────────────┤          │          │
│ Sem 1-2  │ Sem 3-4  │ Sem 5-6  │ Sem 7-8  │          │          │
│ Pipeline │ Grafo    │ Lector   │ Consis-  │          │          │
│ ingesta  │ perso-   │ + chat   │ tencia   │          │          │
│          │ najes    │          │ + auth   │          │          │
│          │          │          │ + deploy │          │          │
│                                          │          │          │
│          HITO: MVP funcional con 20 usuarios beta    │          │
│                                          │          │          │
│                                          ├─── V1 (8 semanas) ──┤
│                                          │ Sem 1-2  │ Sem 3-4  │
│                                          │ Encrypt. │ Features │
│                                          │ envelope │ escritor │
│                                          │          │          │
│                                          │ Sem 5-6  │ Sem 7-8  │
│                                          │ Inmersión│ Pagos +  │
│                                          │ lector   │ publicar │
│                                          │          │          │
│                                                     │          │
│                     HITO: V1 con primeros escritores pagos     │

MAY 2027   JUN 2027   JUL 2027   AGO 2027   SEP 2027   OCT 2027
│          │          │          │          │          │
├──────────────────── V2 (4 meses) ────────────────────┤
│ Marketplace público + Stripe Connect + Lector Premium │
│ Discovery + Social + Analytics de lectores           │
│                                                      │
│          HITO: App pública con modelo de comisiones activo
│                                                      │
│                                          ├── ESCALA ─►
│                                          │ App móvil │
│                                          │ Colabora- │
│                                          │ ción      │
│                                          │ Internac. │
```

**Hitos clave:**
- **Nov 2026**: MVP funcional con pipeline + grafo + chat, 20 beta testers activos
- **Ene 2027**: V1 con encryption + features de escritor + modo lectura inmersivo
- **Mar 2027**: Primeros escritores pagos, publicación a lectores invitados
- **Ago 2027**: Marketplace público, comisiones activadas, crecimiento orgánico
- **2028**: App móvil, colaboración multi-autor

---

## 10. Equipo y habilidades

### Ahora (MVP)

| Rol | Quién | Habilidades necesarias |
|---|---|---|
| Todo | Karla | Python (FastAPI, spaCy, ChromaDB), Next.js, Supabase, Gemini API |

**Tú sola eres suficiente para el MVP.** La arquitectura está diseñada para eso.

### Lo que aprender — orden de prioridad

**Para el MVP (empezar ya):**
| Skill | Cómo aprenderlo | Tiempo |
|---|---|---|
| `spaCy` NER en español | Docs oficiales + tutorial de NER | 3 días |
| `ChromaDB` | Docs oficiales, muy simples | 2 días |
| `nomic-embed-text` via Ollama | `ollama pull nomic-embed-text`, ya tienes Ollama | 1 día |
| `Cytoscape.js` | Tutorial oficial + ejemplos de grafos | 4 días |
| `pymupdf` + `python-docx` | Docs directas | 2 días |
| `Celery + Redis` | Tutorial FastAPI + Celery | 3 días |

**Para el V1 (cuando el MVP esté funcionando):**
| Skill | Tiempo |
|---|---|
| `cryptography` (AES-256-GCM) | 3 días |
| `argon2-cffi` | 1 día |
| Redis sesiones seguras | 2 días |
| Stripe Billing + Webhooks | 4 días |

### Para lanzar con usuarios reales (V1)

| Perfil | Por qué | Alternativa |
|---|---|---|
| Diseñadora UX/UI | La experiencia inmersiva requiere diseño cuidado | Figma + plantillas + mucho feedback de usuarios |
| Frontend/mobile (V2+) | App React Native para móvil | Tú aprendiendo React Native |

### A escala (V2+)

| Rol | Por qué |
|---|---|
| Backend Engineer | Escalar Celery, optimizar embeddings en memoria |
| DevOps/SRE | Infraestructura cuando haya cientos de usuarios activos |
| Trust & Safety (part-time) | Moderación de contenido |
| Growth / Marketing | Escalar canales de adquisición |

---

## 11. Métricas de éxito por fase

### Métricas de producto

| Fase | Métrica | Objetivo |
|---|---|---|
| MVP | Escritores con ≥1 manuscrito procesado | 20 |
| MVP | Tiempo de procesamiento por capítulo | < 2 minutos |
| MVP | Precisión del extractor de personajes (prueba manual) | > 85% |
| V1 | Escritores de pago (primeros 3 meses) | 50 |
| V1 | Retención mensual de escritores | > 70% |
| V1 | Retención semanal de lectores | > 30% |
| V2 | Conversión lector → Lector Premium | > 20% |
| V2 | Conversión Explorador → Creador | > 15% |
| V2 | NPS (Net Promoter Score) escritores | > 50 |

### Métricas de negocio

| Fase | Métrica | Objetivo |
|---|---|---|
| V1 (mes 3) | MRR (Monthly Recurring Revenue) | $400+ (50 escritores × $8) |
| V2 (mes 6) | MRR | $3,000+ |
| V2 (mes 12) | MRR | $15,000+ |
| Escala | CAC (Costo de Adquisición de Cliente) escritor | < $30 |
| Escala | LTV (Lifetime Value) escritor | > $200 |

---

## 12. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| **Gemini API sigue con 503 frecuentes** | Media | Alto | Retry con backoff exponencial (ya implementado); migrar a Claude API cuando haya presupuesto |
| **El extractor de personajes comete errores inaceptables** | Media | Alto | Corrección mediada por IA (ya diseñada); mejorar el prompt; fine-tuning en V3 |
| **Los escritores no pagan por las herramientas** | Baja | Muy alto | Validar en Fase 0 con encuestas; oferta de 14 días gratis de Creador |
| **El huevo y la gallina: sin lectores, sin escritores** | Baja | Alto | Resuelto con modelo B2B2C: escritores traen su audiencia |
| **Costo de embedding en RAM escala mal** | Baja | Medio | Problema de éxito; escalar a servidor con más RAM o batch processing |
| **Stripe no disponible en Perú para escritores** | Baja | Medio | MercadoPago como alternativa; PayPal para payouts en casos extremos |
| **Contenido inapropiado antes de tener sistema de moderación** | Baja (MVP) / Media (V2) | Medio | Beta cerrada en MVP; moderación reactiva desde V1 |
| **Usuario pierde sus 3 frases de recuperación** | Baja | Alto | Advertencia clara en UI; incentivo a guardarlas en papel; este es el trade-off explícito de la privacidad real |
| **DMCA o denuncia de derechos de autor** | Baja | Medio | Proceso DMCA definido desde V1; agente designado antes de abrir a público general |
| **Competidor grande copia la idea** | Media | Medio | El moat está en los datos (el grafo de cada escritor es su lore, no se exporta a competidores) y en la comunidad |

---

## 13. Decisiones arquitectónicas clave (y por qué)

| Decisión | Alternativa rechazada | Razón |
|---|---|---|
| Embeddings locales (Ollama) | Embeddings en API de Google/OpenAI | Los embeddings pueden revertirse parcialmente → privacidad del manuscrito |
| Anonimización antes de la API | Mandar texto completo a la API | La API nunca debe ver los nombres reales del escritor |
| Corrección del grafo mediada por IA | Edición directa drag-and-drop | El grafo debe reflejar el texto, no el deseo del escritor; la IA alerta contradicciones |
| Procesamiento cap por cap (no manuscrito completo) | Procesar todo de una vez | Permite feedback en tiempo real; más fácil de reintentar en errores |
| Procesamiento diferencial (diffs) | Re-procesar el capítulo completo en cada edición | Ahorra costo de embeddings en escritores que revisan constantemente |
| Envelope encryption (V1) | Encriptación de transporte solo (HTTPS) | Un servidor comprometido no puede leer los manuscritos |
| 3 frases personales (1 necesaria) | Frase BIP39 de 12 palabras | El usuario rechazó la longitud; 3 frases propias son más memorables |
| NetworkX + PostgreSQL (MVP) | Neo4j | Más simple para empezar; Neo4j si el grafo crece demasiado |
| Stripe como procesador principal | PayPal o MercadoPago como único | Stripe tiene el mejor soporte para marketplaces (Connect) a escala |
| 6 estados de canon (no solo 2) | binario extraído/autor | El grafo necesita representar incertidumbre, contradicciones y evolución narrativa; 2 estados eran insuficientes |
| IA nunca puede promover a 'canon' sola | auto-confirmación por confianza alta | Falsos positivos destruyen la confianza del escritor; toda confirmación requiere acción humana |
| Audit trail append-only (CANON_EVENTOS) | actualizar el registro directamente | Si se puede borrar, el escritor no puede auditar cómo llegó su grafo al estado actual |
| Provenance (fragmento exacto del texto) | solo referencia al capítulo | El escritor necesita ver por qué el agente infirió lo que infirió; sin el fragmento, es una caja negra |
| Context priority (S/A/B/C) + semántica | solo búsqueda semántica | La búsqueda semántica sola ignora personajes principales si no son textualmante similares a la consulta |
| supersedida_por_id en aristas | solo cap_fin sin linkear | Permite distinguir evolución narrativa (intencional) de contradicción (error); el grafo puede mostrar el timeline de relaciones |

---

## 14. Documentos de detalle

| Documento | Contenido |
|---|---|
| `proyecto_novela.md` | Visión completa, todas las funcionalidades, nombres propuestos, stack tecnológico |
| `plan_tecnico.md` | Arquitectura de privacidad, envelope encryption, semana a semana del MVP y V1 |
| `procesamiento_grafo.md` | Pipeline de extracción, corrección mediada por IA, procesamiento diferencial |
| `monetizacion.md` | Análisis profundo del modelo de ingresos, tiers, B2B2C, por qué los escritores pagan |

---

*Última actualización: octubre 2026*
