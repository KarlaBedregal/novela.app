# Plan Técnico — Arquitectura, Seguridad y Fases de Desarrollo

> Documento complementario a `proyecto_novela.md`
> Enfoque: cómo se construye por dentro, cómo se protege la privacidad, en qué orden.

---

## Principio de diseño central

> El manuscrito de un usuario es su obra. Ni nosotros deberíamos poder leerlo.

Toda la arquitectura parte de ese principio. Las decisiones técnicas se justifican desde ahí.

---

## Las tres fases de privacidad

```
MVP  → Embeddings locales + Anonimización + API externa
V1   → Envelope Encryption + todo lo anterior
V2+  → Self-hosted (solo si la app escala y justifica el costo de GPU)
```

---

## FASE MVP — Embeddings locales + Anonimización + API

### Qué ofrece al usuario

- "Tu manuscrito se procesa en nuestros servidores, nunca se manda completo a ninguna IA externa"
- Fragmentos anonimizados (sin nombres reales) son lo único que sale hacia APIs de Google/Anthropic
- Cumplimiento: GDPR básico, ley peruana de protección de datos (Ley 29733)

### Arquitectura

```
DISPOSITIVO DEL USUARIO
┌──────────────────────────────┐
│  Sube manuscrito (HTTPS)     │
└──────────────┬───────────────┘
               │ tránsito encriptado
               ▼
TUS SERVIDORES
┌──────────────────────────────────────────────────────┐
│                                                      │
│  1. ANONIMIZADOR                                     │
│     - Detecta nombres de personajes y lugares        │
│     - Los reemplaza por tokens: Elena → [CHAR_A]     │
│     - Guarda el mapa de anonimización en DB          │
│       (mapa también encriptado con clave del usuario)│
│                                                      │
│  2. CHUNKER                                          │
│     - Divide el manuscrito en fragmentos de ~500 tok │
│     - Cada chunk tiene metadatos: capítulo, posición │
│                                                      │
│  3. EMBEDDING ENGINE (corre aquí, no en la nube)     │
│     - Modelo: nomic-embed-text (open source, CPU ok) │
│     - Genera vectores para cada chunk                │
│     - Los chunks y vectores se guardan en ChromaDB   │
│       en TU servidor                                 │
│                                                      │
│  4. ChromaDB ← solo vive aquí                        │
│                                                      │
└───────────────────────────┬──────────────────────────┘
                            │ solo cuando se necesita razonamiento
                            │ complejo: fragmentos anonimizados,
                            │ máximo 2-3 chunks a la vez
                            ▼
API EXTERNA (Gemini o Claude)
┌──────────────────────────────┐
│  Ve: "[CHAR_A] descubrió     │
│  que [CHAR_B] era su hermano"│
│                              │
│  No ve: nombres reales,      │
│  manuscrito completo,        │
│  nada identificable          │
└──────────────────────────────┘
                            │
                            ▼
TUS SERVIDORES (de vuelta)
┌──────────────────────────────┐
│  Re-mapeo: [CHAR_A] → Elena  │
│  Respuesta final al usuario  │
└──────────────────────────────┘
```

### Stack técnico del MVP

| Capa | Tecnología | Por qué |
|---|---|---|
| Backend | FastAPI (Python) | Ya lo manejas, rápido de construir |
| Embedding engine | `nomic-embed-text` via Ollama | Open source, corre en CPU, sin API key |
| Vector DB | ChromaDB | Simple, local, Python-nativo |
| Base de datos | Supabase (PostgreSQL) | Ya lo usas en YachAI |
| Grafo de personajes | NetworkX + PostgreSQL | Simple para MVP, migrable a Neo4j después |
| Visualización grafo | Cytoscape.js | Mejor soporte para grafos grandes que D3.js |
| Frontend | Next.js 16 | Ya lo manejas en MIST |
| Auth | Supabase Auth | Ya viene con Supabase |
| Storage | Supabase Storage | Para los archivos subidos |
| API de IA | Gemini API (gratis) → Claude cuando haya presupuesto | Gratis para prototipar |
| Anonimizador | spaCy (NER en español) + reglas | Detecta nombres propios automáticamente |

### Flujo de procesamiento del manuscrito (MVP)

```python
# Pseudocódigo del pipeline completo

def procesar_manuscrito(archivo, usuario_id):

    # 1. Extraer texto
    texto = extraer_texto(archivo)  # soporta .txt, .docx, .pdf

    # 2. Anonimizar
    texto_anon, mapa = anonimizar(texto)
    # texto_anon: "Ayer [CHAR_A] fue al [LOC_A] con [CHAR_B]"
    # mapa: {"CHAR_A": "Elena", "LOC_A": "mercado", "CHAR_B": "Rodrigo"}
    guardar_mapa(mapa, usuario_id)  # encriptado

    # 3. Dividir en chunks
    chunks = dividir_en_chunks(texto_anon, tamaño=500)

    # 4. Generar embeddings LOCALMENTE
    for chunk in chunks:
        vector = modelo_local.embed(chunk.texto)  # nomic-embed-text
        chromadb.guardar(
            id=chunk.id,
            vector=vector,
            metadata={"cap": chunk.capitulo, "pos": chunk.posicion}
        )

    # 5. Extraer grafo de personajes (llamada a API, anonimizado)
    personajes = agente_extractor.extraer(texto_anon[:5000])
    # re-mapear antes de guardar
    grafo = construir_grafo(remapear(personajes, mapa))
    guardar_grafo(grafo, usuario_id)

def responder_pregunta(pregunta, usuario_id):

    # 1. Buscar chunks relevantes LOCALMENTE
    chunks_relevantes = chromadb.buscar(
        query=pregunta,
        usuario_id=usuario_id,
        top_k=3
    )

    # 2. Ya están anonimizados → mandar directo a API
    contexto = "\n".join(c.texto for c in chunks_relevantes)
    respuesta_anon = api_externa.preguntar(contexto, pregunta)

    # 3. Re-mapear la respuesta
    mapa = cargar_mapa(usuario_id)
    return remapear(respuesta_anon, mapa)
```

### Qué construir en el MVP (orden)

**Semana 1-2 — Pipeline de ingesta**
- [ ] Endpoint para subir archivo (TXT, DOCX, PDF)
- [ ] Extractor de texto (librería `pymupdf` para PDF, `python-docx` para DOCX)
- [ ] Anonimizador con spaCy (modelo `es_core_news_lg`)
- [ ] Chunker con solapamiento para no perder contexto entre chunks
- [ ] Integración ChromaDB local
- [ ] Embedding con nomic-embed-text via Ollama

**Semana 3-4 — Grafo de personajes**
- [ ] Agente extractor (Gemini API + texto anonimizado)
- [ ] Esquema de grafo en PostgreSQL (nodos + aristas)
- [ ] Renderizado con Cytoscape.js en Next.js
- [ ] Niebla de guerra básica (bloquear nodos por capítulo)

**Semana 5-6 — Modo lector + chat**
- [ ] Lector de texto básico (mostrar el manuscrito formateado)
- [ ] Grafo visible al lado mientras lees
- [ ] Chat: pregunta → búsqueda en ChromaDB → fragmento anonimizado → API → respuesta
- [ ] Re-mapeo de nombres en respuestas

**Semana 7-8 — Consistencia y pulido**
- [ ] Agente detector de contradicciones (análisis de chunks anonimizados)
- [ ] Auth con Supabase
- [ ] Deploy básico (Railway para backend, Vercel para frontend)
- [ ] Pruebas con manuscritos reales

**Duración total MVP: 8 semanas (2 meses)**

---

## FASE V1 — Envelope Encryption

### Qué agrega

- "Ni nosotros podemos leer tu manuscrito aunque quisiéramos"
- El manuscrito se encripta con una clave derivada de la contraseña del usuario
- Tu servidor guarda datos encriptados — inútiles sin la contraseña del usuario
- Si te llega una orden judicial, entregas datos encriptados. Sin la contraseña del usuario, no sirven

### Cómo funciona (ya explicado antes, resumido aquí)

```
Contraseña del usuario
        ↓
[Argon2id: función de derivación de clave, lenta por diseño]
        ↓
KEK (Key Encryption Key) — NUNCA se guarda, vive solo en memoria
        ↓
DEK (Data Encryption Key) — única por manuscrito, generada aleatoriamente
        ↓
Manuscrito + Embeddings + Mapa de anonimización encriptados con DEK
DEK encriptada con KEK → guardada en DB
        ↓
Tu servidor guarda:
  - Manuscrito encriptado (ilegible)
  - Embeddings encriptados (ilegibles)
  - DEK encriptada (ilegible sin KEK)
  
Tu servidor NO guarda:
  - KEK (se recalcula en cada login desde la contraseña)
  - DEK en claro
  - Nada legible
```

### Qué cambia en el código respecto al MVP

1. Al subir el manuscrito: encriptar antes de guardar en Supabase Storage
2. Al generar embeddings: guardar encriptados en ChromaDB
3. Al procesar: desencriptar en memoria, procesar, limpiar memoria
4. Al guardar el grafo: encriptado también
5. Login: derivar KEK desde contraseña, desencriptar DEK, mantener DEK en sesión (memoria del servidor, no disco)

### Sistema de recuperación de cuenta ✅

**Capas de acceso:**
- Capa 1: contraseña o biométrico (acceso diario)
- Capa 2: 3 frases personales libres — basta con recordar UNA de las tres

**Cómo funciona técnicamente:**

Al crear cuenta, el usuario define 3 frases personales inventadas libremente.
Cada frase deriva su propia clave de recuperación por separado:

```
Frase 1 → Argon2id → clave_rec_1 → encrypt(DEK) → recovery_dek_1  ← guardado en servidor
Frase 2 → Argon2id → clave_rec_2 → encrypt(DEK) → recovery_dek_2  ← guardado en servidor
Frase 3 → Argon2id → clave_rec_3 → encrypt(DEK) → recovery_dek_3  ← guardado en servidor
```

Para recuperar: el usuario ingresa CUALQUIERA de sus 3 frases →
el servidor intenta desencriptar el DEK correspondiente →
si coincide, acceso recuperado → establece nueva contraseña.

Con 1 sola frase recordada es suficiente. Las otras dos son respaldo del respaldo.

**Por qué frases libres y no preguntas fijas:**
Las preguntas predefinidas ("nombre de tu mascota") son adivinables.
Una frase inventada por el usuario tiene espacio casi infinito de posibilidades.

**Advertencia en UI al crear cuenta:**
> "Define 3 frases personales. Con recordar UNA ya puedes recuperar tu cuenta.
> Si olvidas las 3, tu manuscrito no puede recuperarse — ni por nosotros.
> Guárdalas en papel o en un lugar seguro."

### Stack adicional respecto al MVP

| Nuevo componente | Tecnología | Para qué |
|---|---|---|
| Derivación de clave | `argon2-cffi` (Python) | Derivar KEK desde contraseña |
| Encriptación simétrica | `cryptography` (AES-256-GCM) | Encriptar manuscritos y embeddings |
| Gestión de sesión segura | Redis con TTL corto | Guardar DEK en memoria de sesión, no en disco |
| Limpieza de memoria | `ctypes` en Python | Borrar claves de memoria después de usar |

### Qué construir en V1 (orden)

**Semana 1-2 — Infraestructura de encriptación**
- [ ] Módulo de envelope encryption (derivación + encriptación + desencriptación)
- [ ] Migrar almacenamiento de manuscritos a encriptado
- [ ] Migrar embeddings a encriptados
- [ ] Sesiones seguras con Redis

**Semana 3-4 — Features del escritor**
- [ ] Curva emocional del manuscrito (tensión/alivio por capítulo)
- [ ] Alerta en tiempo real al escribir (escena incoherente con el lore)
- [ ] ADN narrativo del escritor
- [ ] Análisis de pacing

**Semana 5-6 — Experiencia inmersiva del lector**
- [ ] Música ambiental (integración con API de audio o playlist por tono)
- [ ] "Entrar a la mente" de un personaje
- [ ] Voces por personaje (ElevenLabs o Kokoro-TTS local)
- [ ] UI adaptativa al tono de la escena

**Semana 7-8 — Social básico**
- [ ] Capa del autor (comentarios desbloqueables por capítulo)
- [ ] Anotaciones del manuscrito por el lector
- [ ] Fichas de personaje sin spoilers para el lector

**Duración total V1: +8 semanas desde el fin del MVP**

---

## Comparación de seguridad por fase

| Escenario | MVP | V1 |
|---|---|---|
| Hacker roba el servidor | Ve embeddings (recuperables parcialmente) | Ve datos encriptados — inutilizables |
| Empleado tuyo curioso | Podría ver manuscritos si accede a la DB | No puede — no tiene las claves de usuarios |
| Orden judicial | Podrías ser obligada a entregar texto | Entregas datos encriptados — sin valor sin contraseña |
| Fuga en API externa | Ve fragmento anonimizado de ~500 tokens | Idem — no cambia, el API nunca ve más |
| Pérdida de contraseña del usuario | No afecta (tu servidor tiene acceso) | **Pérdida permanente del manuscrito** |

La última fila es el trade-off real del V1. Es el precio de la privacidad genuina.

---

## Cronograma integrado

```
Oct 2026    Nov 2026    Dic 2026    Ene 2027    Feb 2027    Mar 2027
│           │           │           │           │           │
├── MVP ────────────────┤           │           │           │
│ Pipeline  │ Grafo     │ Lector    │ Consistencia│         │
│ ingesta   │ personajes│ + chat    │ + deploy  │           │
│           │           │           │           │           │
│                       ├── V1 ─────────────────┤           │
│                       │ Encryption│ Features  │ Inmersión │
│                       │ envelope  │ escritor  │ + social  │
│                       │           │           │           │
│                                               ├── Beta ───►
│                                               │ usuarios reales
```

**Hitos:**
- **Fin Nov 2026**: MVP funcional con pipeline completo + grafo + chat
- **Fin Ene 2027**: V1 con encryption + features escritor + lector inmersivo
- **Mar 2027**: Beta cerrada con escritores reales

---

## Versionado de manuscritos

### El problema
Un escritor reescribe capítulos constantemente. Reprocesar todos los embeddings de un capítulo modificado sería costoso e innecesario.

### Solución: procesamiento diferencial

Un agente compara el capítulo nuevo con el anterior y actúa solo sobre lo que cambió:

```
Capítulo 5 — versión anterior (en DB)
Capítulo 5 — versión nueva (recién subida)
         ↓
Agente compara y detecta el diff semántico:
  - Párrafos iguales → embeddings existentes se reutilizan, no se reprocesa
  - Párrafos nuevos o modificados → se generan nuevos embeddings solo para esos
  - Relaciones cambiadas → se actualiza el grafo solo en los nodos afectados
  - Contradicción con capítulos anteriores → alerta al escritor
```

### Historial de versiones

Se guarda un historial de versiones por capítulo, como un git simplificado:
- No se guardan copias completas, solo los **diffs** entre versiones
- El escritor puede recuperar cualquier versión anterior
- Si borró algo sin querer, puede volver atrás

```
Capítulo 5
  └── v1 (12 oct) — borrador inicial
  └── v2 (14 oct) — reescritura del final
  └── v3 (16 oct) ← versión actual
       [recuperar v1] [recuperar v2]
```

### Anotaciones de lectores ante cambios de versión

Si un lector anotó el capítulo 5 y el escritor publica una v2:
- Las anotaciones se mantienen visibles
- Se marcan con etiqueta visual: `[anotación de v1]`
- El lector puede ver qué cambió entre su versión anotada y la actual
- Nunca se pierden anotaciones por actualizaciones del autor

---

## Interfaz inmersiva por género (sin música generativa)

La música generativa en tiempo real requiere GPU y APIs de costo incierto. Una alternativa factible desde V1: **temas visuales prediseñados por género**.

### Cómo funciona

Al publicar su obra, el escritor elige el género principal. La interfaz de lectura adopta un tema visual coherente con ese género.

| Género | Paleta | Fuente | Efectos visuales | Sonido ambiental |
|---|---|---|---|---|
| Fantasía épica | Dorados, azules profundos | Serif medieval | Partículas de polvo dorado | Viento, lejanas trompetas (loops cortos, libres de derechos) |
| Terror | Negros, rojos oscuros, grises | Serif distorsionada | Viñeta que pulsa en escenas tensas | Silencio con crujidos ocasionales |
| Romance | Rosas, blancos cálidos, lavanda | Script elegante | Destello suave al pasar de página | Lluvia suave, café de fondo |
| Ciencia ficción | Azules neón, negro, plata | Monoespaciada futurista | Escáner al cargar nuevas páginas | Zumbido eléctrico suave |
| Misterio | Sepias, verdes oscuros | Typewriter | Niebla en los bordes | Reloj, lluvia urbana |
| Aventura | Naranjas, verdes selva | Sans-serif robusta | Mapa que se despliega al avanzar | Brisa, naturaleza |

### Ajuste dinámico por tono de escena (V1.5)

Una vez que el agente detecta el tono emocional del capítulo (ya lo hace para la curva emocional), puede:
- Intensificar la viñeta en escenas de tensión
- Aclarar la paleta en escenas de alivio o romance
- Activar/silenciar el loop de sonido ambiental según el ritmo narrativo

Esto no requiere generación de audio — solo mezclar clips cortos pregrabados y ajustar opacidad/saturación de la UI. Factible con CSS + Web Audio API básica.

### Lo que sí queda para versiones futuras

- Música generativa adaptativa (requiere GPU o API musical costosa)
- Sincronización de audio con ritmo de lectura individual
- Composiciones originales por obra

---

## E2EE + Cumplimiento legal

### Viabilidad técnica confirmada

El único punto delicado es la búsqueda en embeddings encriptados. La solución es la sesión como espacio de trabajo temporal:

```
Usuario abre sesión
         ↓
Sus embeddings encriptados se desencriptan en RAM
         ↓
Se construye un índice ChromaDB temporal — solo en memoria, no en disco
         ↓
El agente busca en ese índice durante la sesión
         ↓
Al cerrar sesión: la RAM se limpia, el índice desaparece
         ↓
En disco permanece solo el blob encriptado — ilegible sin la DEK
```

**¿Es escalable?** Para las primeras etapas (cientos de usuarios), sí completamente. A mayor escala, la RAM por sesión se convierte en un costo a optimizar, pero es un problema de éxito.

### Cumplimiento con ley peruana (Ley 29733)

| Obligación de la ley | Cómo E2EE la cumple |
|---|---|
| Consentimiento informado | TOS claros + checkbox explícito al subir manuscrito |
| Finalidad del tratamiento | Los datos se procesan solo para el servicio al propio usuario |
| Seguridad de los datos | AES-256-GCM supera cualquier estándar exigido |
| Derecho de acceso | El usuario puede descargar su manuscrito encriptado + DEK en cualquier momento |
| Derecho de eliminación | Borrar la DEK hace los datos irrecuperables al instante — cumplimiento inmediato |
| No transferencia sin consentimiento | Los fragmentos que van a la API están anonimizados — no son datos personales identificables |

### Postura defensible ante cualquier cuestionamiento legal

> "Los manuscritos de los usuarios están encriptados con claves derivadas de sus propias contraseñas. No tenemos acceso técnico al contenido en texto claro. En caso de orden judicial, podemos entregar los datos encriptados almacenados — sin la contraseña del usuario, son computacionalmente imposibles de descifrar con tecnología actual."

Esto es exactamente lo que declaran ProtonMail y Signal ante requerimientos de autoridades. Es una postura sólida y ya probada en múltiples jurisdicciones.

### Cuándo agregar cumplimiento internacional

- **GDPR (Europa)**: cuando haya usuarios europeos activos. Agrega: derecho a portabilidad de datos, DPO si escala, registro de tratamiento.
- **CCPA (California)**: si se monetiza con datos de usuarios de EEUU.
- **Por ahora**: ley peruana + buenas prácticas internacionales de seguridad es suficiente para el lanzamiento en Latinoamérica.

---

## Lo que aprender en cada fase

### Para el MVP (empezar ya)

| Skill | Cómo aprenderlo | Tiempo |
|---|---|---|
| `spaCy` NER en español | Documentación oficial + tutorial de NER | 3 días |
| `ChromaDB` | Docs oficiales, muy simples | 2 días |
| `nomic-embed-text` via Ollama | `ollama pull nomic-embed-text`, ya tienes Ollama | 1 día |
| `Cytoscape.js` | Tutorial oficial + ejemplos de grafos | 4 días |
| `pymupdf` + `python-docx` | Documentación, muy directas | 2 días |

### Para el V1 (cuando el MVP esté funcionando)

| Skill | Cómo aprenderlo | Tiempo |
|---|---|---|
| `cryptography` (Python) | Docs oficiales + ejemplos AES-GCM | 3 días |
| `argon2-cffi` | Documentación + un ejemplo funcional | 1 día |
| Redis (sesiones) | Tutorial básico de Redis + FastAPI | 3 días |
| ElevenLabs API o Kokoro-TTS | Documentación de la API | 2 días |

---

## Primer paso concreto hoy

Tienes `agente_pro.py` funcionando con `leer_archivo`. El extractor de personajes es:

```python
# Agrega esta herramienta al agente_pro.py o pruébala directamente

def extraer_personajes_de_capitulo(ruta_archivo: str) -> str:
    texto = Path(ruta_archivo).read_text(encoding="utf-8")[:8000]
    
    pregunta = f"""Lee este fragmento de una novela y extrae:
1. Lista de personajes mencionados (nombre y descripción breve si hay)
2. Relaciones entre personajes que puedas inferir
3. Lugares mencionados

Responde en JSON con este formato:
{{
  "personajes": [{{"nombre": "X", "descripcion": "..."}}],
  "relaciones": [{{"de": "X", "tipo": "conoce a", "hacia": "Y"}}],
  "lugares": ["lugar1", "lugar2"]
}}

FRAGMENTO:
{texto}"""
    
    return correr_agente(pregunta)
```

Si tienes alguna de tus novelas en texto digital, pruébalo hoy. Eso es el núcleo del MVP.

---

*Última actualización: octubre 2026*
*Ver también: `proyecto_novela.md` para la visión completa del producto*
