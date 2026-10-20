# Estrategia de Procesamiento del Grafo y Corrección con IA

> Cómo se construye el grafo, qué se procesa, en qué orden, y cómo el autor corrige errores sin edición manual directa.

---

## Qué importa procesar (y qué no)

No todo el texto de una novela tiene el mismo valor para construir el grafo. El pipeline debe enfocarse en lo que genera estructura narrativa real.

### Prioridad alta — construir esto primero

| Elemento | Qué es | Por qué importa |
|---|---|---|
| **Personajes** | Nombres propios, apodos, títulos ("el Coronel", "la señora Ramos") | Son los nodos del grafo |
| **Relaciones** | Quién hace qué a quién, vínculos explícitos e implícitos | Son las aristas del grafo |
| **Eventos clave** | Acciones que cambian el estado de la historia o de una relación | Anclan la timeline |
| **Atribución de diálogo** | Quién dijo qué | Revela relaciones y personalidad |
| **Objetos con peso narrativo** | La espada, la carta, el mapa — solo los que mueven la trama | Nodos secundarios del grafo |
| **Lugares** | Dónde ocurren las escenas | Contexto del grafo, base del mapa |

### Prioridad baja — no procesar en MVP

| Elemento | Por qué esperar |
|---|---|
| Descripciones físicas largas | Útiles para fichas de personaje pero no para el grafo |
| Prosa paisajística | No genera estructura |
| Metáforas y simbolismo | Requieren comprensión profunda, fácil de equivocar |
| Subtexto implícito | El agente fallará más de lo que ayudará sin fine-tuning |

---

## Flujo de procesamiento — capítulo por capítulo

El modo natural de uso es que el escritor trabaje capítulo a capítulo. El grafo crece con él.

```
Escritor termina el capítulo 3
         ↓
Guarda / marca como "listo para procesar"
         ↓
Pipeline se activa (asíncrono — el escritor puede seguir escribiendo)
         ↓
┌──────────────────────────────────────────────────────┐
│ 1. EXTRACCIÓN DE ENTIDADES                           │
│    spaCy detecta: personas, lugares, objetos clave   │
│    El agente refina: distingue apodos, resuelve      │
│    correferencias ("él" → "Rodrigo")                 │
│    → Cada nodo se crea con estado = 'suggestion'     │
│    → Se guarda el fragmento exacto del texto:        │
│      fuente_primera_mencion + pos_inicio/pos_fin     │
│                                                      │
│ 2. EXTRACCIÓN DE RELACIONES                          │
│    El agente analiza el capítulo anonimizado         │
│    y extrae: "[CHAR_A] traicionó a [CHAR_B]",        │
│    "[CHAR_C] descubrió que [LOC_A] era una trampa"   │
│    → Cada arista se crea con estado = 'suggestion'   │
│    → Se guarda fuente_texto + posición exacta        │
│    Nunca se promociona a 'canon' sin el autor        │
│                                                      │
│ 3. DETECCIÓN DE CONTRADICCIONES                      │
│    Compara con el grafo existente capítulo a cap.    │
│    Si dos aristas del mismo par de nodos dicen       │
│    cosas incompatibles → estado = 'contradictory'   │
│    → genera alerta para el escritor con los dos      │
│      fragmentos de texto en conflicto                │
│                                                      │
│ 4. CLASIFICACIÓN DE PRIORIDAD (S/A/B/C)             │
│    Asigna prioridad a cada nodo y arista:            │
│    S = aparece en este capítulo + alta centralidad   │
│    A = mencionado en los últimos 10 capítulos        │
│    B = personaje secundario o lore de fondo          │
│    C = personaje menor, evento histórico distante    │
│    El autor puede hacer override manual en cualquier │
│    momento desde la interfaz del grafo               │
│                                                      │
│ 5. ACTUALIZACIÓN DEL GRAFO                           │
│    - ¿El nodo ya existe? → actualiza propiedades     │
│    - ¿Es nuevo? → crea nodo (estado: suggestion)     │
│    - ¿La relación cambió? → actualiza arista         │
│    - ¿Relación reemplaza a otra? → marca la vieja   │
│      como superseded, linkea con supersedida_por_id  │
│                                                      │
│ 6. EMBEDDINGS DEL CAPÍTULO                           │
│    Genera y guarda embeddings localmente (Ollama)    │
│    Cada chunk hereda la prioridad del capítulo       │
└──────────────────────────────────────────────────────┘
         ↓
Grafo actualizado visible al instante
Escritor ve: "capítulo 3 procesado — 2 nuevos personajes, 1 alerta"
```

### Feedback visual durante el procesamiento

```
[procesando capítulo 3...]  ████████░░  80%
Encontrados hasta ahora:
  • 3 personajes nuevos
  • 1 lugar nuevo: la taberna del puerto
  • ⚠ Posible inconsistencia: "Diego" mencionado en cap 1 como muerto
```

El escritor no espera mirando una pantalla en blanco. Ve el grafo llenarse en tiempo real.

---

## Opción de carga completa del manuscrito

Para escritores que llegan con una novela ya terminada:

```
┌─────────────────────────────────────────────────────┐
│  Vas a subir un manuscrito completo.                │
│                                                     │
│  El grafo se construirá en segundo plano.           │
│  Tiempo estimado: ~8 minutos para 80,000 palabras   │
│                                                     │
│  Puedes cerrar esta ventana — te avisaremos         │
│  cuando esté listo.                                 │
│                                                     │
│  El grafo parcial irá apareciendo capítulo          │
│  a capítulo mientras se procesa.                    │
│                                                     │
│          [Entendido, procesar]                      │
└─────────────────────────────────────────────────────┘
```

El procesamiento va capítulo por capítulo de todas formas. La interfaz muestra el progreso y el grafo crece visiblemente. El usuario puede empezar a explorar los primeros capítulos mientras los últimos se procesan.

### Stack para el procesamiento asíncrono

```
FastAPI recibe el capítulo
    ↓
Encola la tarea en Redis
    ↓
Worker Celery la toma y procesa
    ↓
Actualiza el grafo en PostgreSQL
    ↓
Notifica al frontend vía WebSocket: "capítulo X procesado"
    ↓
Cytoscape.js actualiza el grafo en vivo sin recargar la página
```

---

## Corrección del grafo mediante revisión de la IA

El grafo automático va a cometer errores. El escritor no edita el grafo directamente con drag-and-drop — eso rompe la consistencia con el texto. En cambio:

### Flujo de corrección

```
Escritor ve en el grafo: "Elena — amiga de — Rodrigo"
Escritor sabe que en realidad son hermanos
         ↓
Escritor envía corrección:
"La relación entre Elena y Rodrigo no es de amistad.
 Son hermanos. Esto se revela en el capítulo 7."
         ↓
El agente revisa el texto del capítulo 7
         ↓
┌─────────────────────────────────────────────────────┐
│ Caso A — la corrección está en el texto             │
│   El agente confirma, actualiza la arista           │
│   "Elena — hermana de — Rodrigo"                    │
│   Resultado: corrección aplicada                    │
│                                                     │
│ Caso B — la corrección no está en el texto          │
│   El agente no encuentra evidencia en el capítulo   │
│   Responde: "No encontré esta relación en cap 7.    │
│   ¿En qué capítulo se revela? ¿O quieres que        │
│   la agregue como 'información del autor'?"          │
│                                                     │
│ Caso C — la corrección contradice el texto          │
│   El agente alerta: "En cap 3 el texto dice         │
│   explícitamente que no son familia. ¿Confirmas     │
│   este cambio de todas formas?"                     │
└─────────────────────────────────────────────────────┘
```

### Por qué este enfoque y no edición directa

- Mantiene el grafo como reflejo del texto, no del deseo del escritor
- Detecta inconsistencias: si el escritor "corrige" algo que contradice su propio texto, el agente lo alerta
- Crea un historial de correcciones justificadas
- Evita que el grafo y el texto diverjan silenciosamente

### Tipos de correcciones soportadas

| Corrección | Ejemplo |
|---|---|
| Cambiar tipo de relación | "No son amigos, son rivales" |
| Fusionar personajes duplicados | "El Viejo y el Señor Fuentes son la misma persona" |
| Separar personajes confundidos | "María la del cap 2 y María la del cap 8 son personas distintas" |
| Agregar relación faltante | "Rodrigo es el hijo del General, no aparece explícito pero es canon del autor" |
| Marcar como irrelevante | "Ese personaje es un extra, no debe estar en el grafo principal" |

### Los 6 estados del canon

Cada nodo y cada arista tiene un campo `estado` que evoluciona con la narrativa:

| Estado | Significado | Quién lo asigna |
|---|---|---|
| `suggestion` | Extraído por la IA, pendiente de validación | Pipeline automático |
| `canon` | Verdad confirmada del universo | El autor lo aprueba |
| `draft` | El autor lo planea, aún no lo ha escrito | El autor lo declara |
| `ambiguous` | Aparece en el texto pero su lectura es incierta | El autor lo marca |
| `contradictory` | Conflicto real detectado entre capítulos | Pipeline o el autor |
| `superseded` | Fue canon, reemplazado por evolución narrativa | El autor lo declara |

**Regla fundamental:** el agente nunca puede promover una entidad de `suggestion` a `canon` por sí solo. Solo el autor puede hacer esa confirmación.

**Supersesión:** cuando una relación evoluciona (Elena deja de ser amiga de Rodrigo para ser su enemiga), el autor marca la vieja arista como `superseded` y crea la nueva. El campo `supersedida_por_id` las vincula. La visualización del grafo puede mostrar esta evolución en la vista de timeline.

Esto permite usar el grafo también como herramienta de planificación: el autor puede declarar relaciones en estado `draft` que aún no ha escrito, y el agente las monitorea para confirmarlas automáticamente cuando aparezcan en el texto.

---

## Sistema de prioridad de contexto (context priority)

Cuando el agente responde preguntas o ayuda al escritor con un nuevo capítulo, necesita saber *qué contexto incluir en el prompt*. Una novela larga puede tener miles de fragmentos en ChromaDB. Mandarlos todos es inviable. La búsqueda semántica sola no es suficiente — puede encontrar el fragmento más *similar* al texto pero ignorar el dato más *importante* del universo.

### El problema concreto

El escritor pregunta: "¿qué sabe Elena de la traición de Rodrigo en este punto de la historia?"

La búsqueda semántica devuelve fragmentos sobre "traición" — pero si no sabemos que Elena es la protagonista principal, podríamos omitir su ficha completa de personaje y su historial de relación con Rodrigo.

### Solución: prioridad fija + búsqueda semántica complementaria

```
Contexto para el agente = (fijo por prioridad) + (dinámico por semántica)

Siempre incluir (Prioridad S):
  — personajes que aparecen en el capítulo actual
  — hechos establecidos en los últimos 3 capítulos
  — relaciones activas entre esos personajes

Incluir si hay espacio (Prioridad A):
  — personajes mencionados indirectamente en el capítulo
  — relaciones establecidas en los últimos 10 capítulos

Incluir como complemento semántico (B/C):
  — top-K resultados del vector search en ChromaDB
  — lore de fondo relevante a la consulta específica

Nunca incluir automáticamente (Prioridad D):
  — hechos superseded (se pueden consultar explícitamente)
  — entidades con estado 'suggestion' no confirmadas
```

### Cómo se asigna la prioridad automáticamente

La prioridad inicial se calcula en el paso 4 del pipeline con tres señales:

1. **Recencia**: ¿cuántos capítulos hace que se mencionó esta entidad?
   - Últimos 3 capítulos → S
   - Últimos 10 capítulos → A
   - Más de 10 capítulos → B o C

2. **Centralidad en el grafo**: ¿cuántas aristas tiene este nodo?
   - Grado alto (personaje principal) → sube un nivel de prioridad
   - Grado bajo (personaje menor) → baja un nivel

3. **Override manual del autor**: el escritor puede marcar cualquier nodo como S ("esta regla del universo siempre debe estar en contexto") o como C ("este personaje ya no importa").

### Beneficio concreto en tokens

Sin prioridad: el agente recibe 20-30 fragmentos por cosine similarity → ~4,000 tokens de contexto, mucho ruido.

Con prioridad: 5-8 fragmentos de alta prioridad + 3-5 de búsqueda semántica → ~1,200 tokens de contexto, todo relevante. Respuestas más precisas, costo ~3x menor.

---

## Resumen del stack de este módulo

| Componente | Tecnología |
|---|---|
| NER inicial | spaCy `es_core_news_lg` |
| Refinamiento y relaciones | Gemini API (texto anonimizado) |
| Resolución de correferencias | Agente + contexto del capítulo |
| Embeddings | `nomic-embed-text` vía Ollama (local) |
| Cola de tareas | Celery + Redis |
| Notificación en tiempo real | WebSockets |
| Grafo en base de datos | PostgreSQL (nodos + aristas con metadatos) |
| Visualización | Cytoscape.js |

---

*Ver también: `plan_tecnico.md` para la arquitectura de seguridad y fases de desarrollo*
