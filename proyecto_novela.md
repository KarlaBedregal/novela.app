# Proyecto: App de Escritura y Lectura Inmersiva con IA

> Un universo viviente donde el escritor construye el mundo y el lector lo explora.
> La IA conecta ambos lados.

---

## Visión general

Esta app sirve a **dos públicos** con una sola plataforma:

| Escritor | Lector |
|---|---|
| Asistente que conoce profundamente su universo | Explorador del universo construido por el autor |
| Detecta inconsistencias, tramas olvidadas | Navega el lore sin spoilers |
| Ve cómo sus lectores experimentan la historia | Vive la historia de forma inmersiva |
| Construye el grafo de personajes mientras escribe | El grafo se revela conforme avanza |

El diferenciador central: **ninguna app une escritor y lector en el mismo ecosistema**.
Las apps actuales son herramientas de escritura (Sudowrite, Novelcrafter) o lectores pasivos (Kindle, epub).
Esta app es ambas cosas — y la IA las conecta.

---

## Funcionalidades completas

### NÚCLEO — El grafo de lore

- **Grafo de personajes interactivo**: nodos (personaje, lugar, evento, objeto importante) y aristas (conoce a, ama, traicionó, fue testigo de, es familiar de)
- **Extracción automática**: el agente lee el manuscrito y construye el grafo sin intervención manual
- **Niebla de guerra para lectores**: el grafo se revela progresivamente conforme avanza la lectura — spoiler-safe por diseño
- **Timeline de la historia**: eje horizontal con eventos, capítulos y apariciones de personajes; se puede navegar en el tiempo
- **"¿Qué sabe este personaje en el capítulo X?"**: consulta al agente sobre el estado de conocimiento de cualquier personaje en cualquier punto
- **Grafo diferencial**: muestra cómo cambian las relaciones a lo largo de la historia (una arista puede pasar de "aliados" a "enemigos")

---

### HERRAMIENTAS DEL ESCRITOR

#### Consistencia y análisis
- **Detector de contradicciones**: color de ojos que cambia, cronología imposible, personajes que saben cosas antes de enterarse
- **Rastreador de tramas abiertas**: detecta subtramas introducidas y nunca resueltas
- **Personajes olvidados**: alerta cuando un personaje con peso narrativo desaparece muchos capítulos sin mención
- **Análisis de ritmo y pacing**: identifica capítulos lentos, tramos sin tensión, picos dramáticos concentrados
- **Curva emocional visible**: gráfico de tensión/alivio/sorpresa/tristeza por capítulo — como un electrocardiograma de la novela. Comparable con curvas de libros publicados del mismo género
- **Análisis de diálogo**: detecta personajes con patrones de habla demasiado similares

#### Asistencia de escritura
- **Autocompletado coherente con el universo**: no sugiere cosas que contradigan el lore ya establecido
- **Alerta en tiempo real**: al escribir una escena, avisa si el personaje está usando información que aún no debería tener
- **"Escribe desde este POV"**: genera el borrador de una escena desde la perspectiva interna de cualquier personaje
- **Perfil de personaje desde el texto**: el agente genera automáticamente la ficha de un personaje leyendo el manuscrito
- **ADN narrativo del escritor**: analiza estilo, densidad de vocabulario, frecuencia de diálogo vs. descripción, ritmo de oraciones. Genera una huella narrativa y compara con autores publicados
- **Beta reader AI**: da feedback desde distintas perspectivas (lector adolescente, lector adulto, fan del género, crítico)
- **Detector de referencias culturales que envejecerán mal**: señala menciones de tecnología, memes o cultura pop que pueden caducar

#### Worldbuilding
- **Templates estructurados**: sistema de magia, geografía, política, razas/especies, cronología histórica del mundo
- **Mapa del mundo interactivo**: creado por el escritor, se desbloquea para lectores con cada capítulo

#### Analytics del escritor
- **Heatmap de lectores**: dónde los lectores aceleran, dónde pausan, dónde abandonan (agregado y anonimizado)
- **Puntos de abandono**: el sistema detecta en qué capítulo pierde lectores con más frecuencia
- **Comparación de curva emocional esperada vs. vivida**: el autor predice cómo sentirán los lectores cada capítulo, el sistema muestra lo que realmente ocurrió

---

### EXPERIENCIA DEL LECTOR

#### Inmersión
- **Música generativa**: la IA lee el tono emocional del párrafo actual y genera/ensambla música en tiempo real — no una playlist fija, sino algo que cambia con cada escena
- **Sonido ambiental sincronizado**: lluvia en escenas de tormenta, silencio tenso en confrontaciones, ambiente urbano en ciudades
- **Voces por personaje**: cada personaje tiene una voz AI distinta al leer en voz alta; personalizable. La autora puede grabar su propia voz como narradora
- **UI adaptativa al tono**: la interfaz cambia sutilmente (colores, tipografía, animaciones) según el estado emocional de la escena
- **Mapa del mundo que se revela**: las ubicaciones aparecen en el mapa a medida que el lector las visita en la historia

#### Exploración del universo
- **"Entrar a la mente" de un personaje**: al tocar un personaje durante la lectura, la IA reescribe ese pasaje desde adentro de su cabeza — lo que piensa pero no dice
- **Reconstrucción espacial de escenas**: diagrama de planta mostrando la posición de cada personaje en una escena, con lenguaje corporal y expresiones
- **Ficha de personaje sin spoilers**: toca cualquier personaje y ve solo lo que ya sabes de él hasta ese punto
- **"¿Dónde apareció por primera vez?"**: navegación rápida a la primera mención de cualquier personaje o lugar
- **Predicciones**: antes de cada capítulo, el lector puede registrar qué cree que pasará — al terminar ve si acertó

#### Contenido extra
- **Capa del autor (desbloqueables)**: el escritor incrusta comentarios de director en pasajes específicos — "esta escena la reescribí 7 veces", "este personaje está basado en alguien real". Se desbloquean al terminar el capítulo
- **Escenas alternativas ("¿Qué si?")**: el escritor puede publicar versiones alternativas de escenas que no entraron al libro final. El lector las explora como caminos no tomados. Claramente marcadas como no-canon
- **Anotaciones de fans verificados**: como Genius para letras, pero para novelas. El escritor puede marcar algunas como "headcanon oficial"

#### Social y comunidad
- **Clubes de lectura sincronizados**: grupos que leen al mismo ritmo, con chat protegido por spoilers según el capítulo actual
- **Teorías de fans con fact-checking**: el agente verifica automáticamente si una teoría es consistente con el texto o la contradice
- **Reacciones por pasaje**: los lectores pueden marcar pasajes con emociones (😭💔😂😱) — el escritor ve el mapa de impacto emocional de su obra

---

### MODO COLABORATIVO (universos compartidos)

- **Múltiples escritores en el mismo universo**: cada uno con sus personajes, el lore compartido es consistente
- **Control de versiones del lore**: historial de cambios en el canon, como git para el universo
- **Detector de contradicciones entre coautores**: el agente alerta cuando dos escritores crean información incompatible
- **Contribuciones de la comunidad**: el autor puede "adoptar" elementos de fan-fiction al canon oficial

---

## Nombres propuestos

| Nombre | Concepto | Por qué |
|---|---|---|
| **Inkverse** | ink + universe | Corto, memorable, funciona en español e inglés |
| **Trama** | trama (plot/weave en español) | Una sola palabra, evoca tejido de historias |
| **Loreverse** | lore + universe | Directo al concepto central |
| **Fabulex** | fábula + lexicon | Sonido latino, literario, único |
| **Cosmolore** | cosmos + lore | Evoca universo propio de cada historia |
| **Narratum** | raíz latina de narrar | Suena a producto premium y serio |
| **Palimpsesto** | manuscrito donde el texto antiguo se filtra bajo el nuevo | Metáfora de capas de historia; muy literario |
| **Nexum** | latín: conexión, vínculo | Corto, evoca el grafo de relaciones |
| **Mundorama** | mundo + panorama | Evoca el worldbuilding completo |
| **Arcanae** | arcana (conocimiento oculto) | Evoca el lore profundo del universo |

**Recomendación**: **Inkverse** o **Trama** para posicionamiento comercial. **Palimpsesto** o **Arcanae** si el target es literario/premium.

---

## Stack tecnológico

### Frontend web
- **Next.js 16** con App Router (ya lo usas en MIST)
- **TailwindCSS** para estilos
- **D3.js** o **Cytoscape.js** para el grafo visual interactivo
- **Framer Motion** para animaciones de la UI adaptativa
- **WebSockets** (Socket.io) para colaboración en tiempo real

### Frontend móvil
- **React Native** con Expo (reutiliza conocimiento de React)
- O **Flutter** (Dart) si se quiere máximo rendimiento nativo

### Backend
- **FastAPI** (Python — ya lo dominas)
- **WebSockets** para features en tiempo real
- **Celery + Redis** para tareas largas en background (análisis de manuscritos)

### Base de datos
- **Supabase** (PostgreSQL) para usuarios, datos relacionales (ya lo usas en YachAI)
- **Neo4j** o **NetworkX + PostgreSQL** para el grafo de personajes
- **ChromaDB** o **Qdrant** (vector DB) para búsqueda semántica dentro del manuscrito

### IA y agentes
- **Gemini API** (gratis para prototipar) o **Claude API** (mejor para análisis largo de texto)
- **LangChain** o **LangGraph** para flujos de agente más complejos
- **Embeddings** (text-embedding-004 de Google o similar) para el vector DB
- **ElevenLabs API** o **Kokoro-TTS** (local) para voces de personajes
- **MusicGen** (Meta, open source) o **Suno API** para música generativa

### Infraestructura
- **Vercel** para el frontend Next.js
- **Railway** o **Render** para el backend FastAPI
- **Cloudflare R2** para almacenamiento de manuscritos y audio

---

## Plan de desarrollo

### Fase 0 — Validación (2 semanas)
> ¿Vale la pena construirlo? ¿La gente lo usaría?

- Crear una landing page con la propuesta de valor
- Encuestar a 20-30 escritores/lectores
- Construir el prototipo más simple posible: subir texto → extraer personajes → mostrar lista
- Objetivo: confirmar que la idea interesa antes de invertir meses

---

### Fase 1 — MVP (2-3 meses)
> Lo mínimo que demuestra la idea central

**Funcionalidades:**
- [ ] Subir manuscrito (TXT, DOCX, PDF)
- [ ] Agente extrae personajes y relaciones automáticamente
- [ ] Grafo visual interactivo (D3.js o Cytoscape.js)
- [ ] Niebla de guerra básica (el lector activa "modo lectura", el grafo se bloquea)
- [ ] Modo lector: leer el texto con el grafo al lado
- [ ] Chat con el agente: *"¿Qué sabe X sobre Y en el capítulo 5?"*
- [ ] Detector básico de contradicciones

**Tiempo estimado**: 2 meses solo, 1 mes con equipo de 2

---

### Fase 2 — Experiencia del lector (2-3 meses)
> Hacer que leer en la app sea notablemente diferente

**Funcionalidades:**
- [ ] Música generativa o seleccionada por tono de escena
- [ ] Sonido ambiental sincronizado
- [ ] Voces por personaje (TTS con ElevenLabs o similar)
- [ ] "Entrar a la mente" de un personaje
- [ ] Fichas de personaje sin spoilers
- [ ] Mapa del mundo (si el libro tiene worldbuilding)
- [ ] Desbloqueables del autor

**Tiempo estimado**: +2 meses

---

### Fase 3 — Herramientas del escritor (2-3 meses)
> Hacer que escribir con la app sea notablemente mejor

**Funcionalidades:**
- [ ] ADN narrativo del escritor
- [ ] Curva emocional del manuscrito
- [ ] Alerta en tiempo real al escribir
- [ ] Análisis de pacing y ritmo
- [ ] Beta reader AI (múltiples perspectivas)
- [ ] Analytics básico de lectores

**Tiempo estimado**: +2-3 meses

---

### Fase 4 — Social y colaborativo (3-4 meses)
> Crear comunidad alrededor de los universos

**Funcionalidades:**
- [ ] Clubes de lectura sincronizados
- [ ] Anotaciones de fans
- [ ] Teorías con fact-checking automático
- [ ] Coautoría y universos compartidos
- [ ] Sistema de contribuciones de comunidad

**Tiempo estimado**: +3 meses

---

### Estimación total

| Escenario | Tiempo |
|---|---|
| Tú sola, dedicación parcial (tardes/fines de semana) | 18-24 meses |
| Tú sola, dedicación completa | 10-14 meses |
| Equipo de 2 (tú + 1 frontend/mobile) | 7-10 meses |
| Equipo de 3-4 personas | 5-7 meses |

---

## Qué necesitas aprender

### Ya dominas ✅
- Python (backend, algoritmos, FastAPI)
- Next.js / React (MIST)
- Supabase (YachAI)
- Algoritmos complejos (APU, VERA)
- Git y GitHub
- Manejo de APIs de IA (lo estás aprendiendo ahora)

### Debes aprender — alta prioridad 🔴
| Skill | Para qué | Tiempo estimado |
|---|---|---|
| **D3.js o Cytoscape.js** | Renderizar el grafo visual | 2-3 semanas |
| **Vector databases (ChromaDB)** | Búsqueda semántica en manuscritos | 1-2 semanas |
| **Embeddings** | Representar texto para búsqueda semántica | 1 semana |
| **LangChain / LangGraph** | Flujos de agente más complejos | 2-3 semanas |
| **WebSockets** | Features colaborativas en tiempo real | 1 semana |

### Debes aprender — prioridad media 🟡
| Skill | Para qué | Tiempo estimado |
|---|---|---|
| **React Native / Expo** | App móvil | 3-4 semanas |
| **Neo4j o NetworkX** | Base de datos de grafos | 2 semanas |
| **Redis + Celery** | Tareas asíncronas (analizar manuscritos grandes) | 1 semana |
| **ElevenLabs / TTS APIs** | Voces de personajes | 3 días |

### Puedes delegar o aprender después 🟢
- UX/UI design avanzado
- MusicGen / audio generativo (complejo, mejor integrar API)
- DevOps / deployment (Railway/Render son simples)

---

## Perfiles que necesitarías sumar

Si construyes en equipo:

| Perfil | Por qué es necesario | Puedes reemplazar con... |
|---|---|---|
| **Frontend / Mobile developer** | React Native o Flutter para móvil | Tú aprendiendo React Native |
| **UX/UI Designer** | La experiencia inmersiva requiere buen diseño | Figma + plantillas + mucho feedback de usuarios |
| **AI/ML Engineer** | Música generativa, embeddings, fine-tuning | Tú + APIs existentes (sin fine-tuning propio) |
| **DevOps (parcial)** | Escalar cuando haya usuarios reales | Railway/Render/Vercel lo hacen simple al inicio |

**Mínimo viable para el MVP**: tú sola eres suficiente.
**Para lanzar con usuarios reales**: tú + 1 diseñador/frontend.

---

## Próximos pasos concretos

1. **Esta semana**: construir el extractor de personajes con el agente que ya tienes (Gemini + `leer_archivo`)
2. **Semana 2**: renderizar el grafo con Cytoscape.js en una página web simple
3. **Semana 3-4**: conectar el grafo al lector (modo lectura básico en Next.js)
4. **Mes 2**: agente de consistencia que detecta contradicciones reales

El paso 1 lo puedes hacer hoy con lo que ya aprendiste.

---

*Documento generado: octubre 2026*
