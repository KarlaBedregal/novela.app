# Emprendimiento — Equipo, Financiamiento y Go-to-Market

> Documento complementario a `estructura_proyecto.md`
> Cubre: nombres, perfiles del equipo, co-fundadores, financiamiento y validación del modelo de negocio.
> Última actualización: octubre 2026

---

## 1. Nombres candidatos

### Metodología de verificación (hacer antes de registrar cualquier nombre)

1. **Google**: busca el nombre exacto entre comillas — ¿hay un producto de software activo?
2. **INDECOPI** (Perú): `indecopi.gob.pe` → Registro de Marcas
3. **Dominio**: `namecheap.com` — verificar disponibilidad de `.com`, `.io`, `.app`
4. **Redes sociales**: `namechk.com` — Instagram, Twitter, TikTok disponibles
5. **USPTO** (si se proyecta mercado US): `tmsearch.uspto.gov`

### Candidatos recomendados

| Nombre | Origen / Significado | Riesgo de conflicto | Nota |
|---|---|---|---|
| **Paracosm** | Término psicológico: "mundo imaginario detallado creado en la mente" | Muy bajo | **Recomendación principal.** El significado es exactamente lo que hace la app. |
| **Tessera** | Latín: pieza de mosaico | Bajo | Cada capítulo es una pieza del universo. Corto, funciona en inglés y español. |
| **Codexia** | Codex (libro antiguo) + sufijo -ia | Bajo | Inventado, evoca libros clásicos + plataforma moderna. |
| **Fablion** | Fable + sufijo inventado | Muy bajo | Corto, memorable en LATAM, fácil de pronunciar. |
| **Loriom** | Lore + -iom | Muy bajo | Único, inventado, casi seguro libre. |
| **Narratum** | Latín: narración | Medio | Literario y serio. Verificar uso en educación. |
| **Foliant** | Folio (página) + variante | Bajo | Evoca plataforma literaria profesional. |
| **Inkverse** | Ink + universe | Medio | Nombre anterior propuesto. Verificar — "verse" y "ink" son genéricos pero la combinación puede estar en uso. |
| **Trama** | Español: trama (plot / tejido) | Alto | Muy genérico, múltiples usos. Solo usable con diferenciador visual muy fuerte. |

**Nota sobre copyright de nombres:** Los nombres en sí no tienen copyright (el copyright aplica a obras, no a palabras). Lo que hay que registrar es la **marca comercial (trademark)**. Un nombre disponible como dominio no garantiza que esté libre de trademark — verificar siempre en INDECOPI/USPTO.

---

## 2. Perfiles del equipo

### Ahora — MVP (solo Karla)

El MVP está diseñado para ser construido sola. Las tecnologías clave (Python, FastAPI, Next.js, Supabase) ya las dominas. El tiempo de aprendizaje estimado para las nuevas (spaCy, ChromaDB, Cytoscape.js) es 2 semanas.

**No necesitas socios para el MVP.** Tener un co-fundador mal elegido es peor que no tenerlo.

### Para lanzar con usuarios reales (V1) — perfil crítico

| Perfil | Por qué es necesario | Opciones |
|---|---|---|
| **UX/UI Designer** | La experiencia inmersiva es el diferenciador central. Si la UI es mediocre, el producto fracasa. | Co-fundador o freelancer bien pagado (con parte del presupuesto de ProInnóvate si lo consigues) |

Este es el único perfil urgente antes de lanzar con usuarios reales.

### Para crecer (V2+)

| Perfil | Cuándo | Por qué |
|---|---|---|
| **Backend Engineer / DevOps** | Cuando haya 100+ usuarios activos | Escalar Celery, optimizar embeddings, seguridad en producción |
| **Growth / Marketing** | Cuando el producto esté validado | Escalar canales de adquisición, SEO, comunidades |
| **Mobile Developer** | V3 (app móvil) | React Native o Flutter |
| **Trust & Safety (part-time)** | Con publicación pública (V2) | Moderación de contenido |

---

## 3. Co-fundadores — cuándo y cómo buscarlos

### ¿Necesito un co-fundador?

Depende de la fase. Para el MVP: no. Para el lanzamiento y crecimiento: un co-fundador del perfil correcto multiplica las posibilidades de éxito (la mayoría de aceleradoras como YC prefieren equipos de 2-3 personas sobre fundadores solos).

### Perfiles complementarios a buscar

El perfil de Karla cubre: backend Python, frontend Next.js, algoritmos, manejo de APIs de IA. Lo que falta:

| Perfil ideal de co-fundador | Por qué complementa | Aporte concreto |
|---|---|---|
| **Diseñador UX/UI con visión de producto** | La experiencia visual es el diferenciador central y no es tu fuerte técnico | Diseña la UI inmersiva, el grafo visual, la identidad de marca |
| **Escritor/editor con audiencia propia** | Conoce el problema desde adentro + puede traer los primeros 50 escritores | Valida features, es el primer usuario real, trae red de contactos |
| **Perfil de negocios/growth** | Si el lado tech está cubierto, necesitas a alguien que se encargue de ventas, partnerships, go-to-market | Consigue los primeros clientes, gestiona relaciones con inversores |

**Lo más importante:** que sea alguien comprometido a largo plazo, con habilidades que tú no tienes, y que confíe en el proyecto aunque no haya dinero todavía.

### Dónde encontrar co-fundadores

1. **JAKU Emprende UNSA** (tu propia universidad) — programa de incubación donde hay estudiantes buscando proyectos. Acércate directamente.
2. **Hackathons en Arequipa** — VinculaTech, eventos de UCSP, eventos de UTEC Ventures en Lima
3. **YC Co-founder Matching** (`ycombinator.com/cofounder-matching`) — plataforma global gratuita de YC para encontrar co-fundadores técnicos y de negocio
4. **LinkedIn** — busca "UX designer + escritura + LATAM" o "product manager + startup + Arequipa"
5. **Comunidades de escritores tech** — alguien que sea escritor Y sea técnico o de negocios es el co-fundador ideal

---

## 4. Financiamiento — opciones reales desde Perú

### Ruta recomendada (de menor a mayor complejidad)

```
Ahora (oct 2026)
  → Construir MVP gratis (costo real: $0 con tiers gratuitos de servicios)
  → Acercarte a JAKU Emprende UNSA (es tu propia universidad)

Con MVP funcional (ene-feb 2027)
  → Postular a StartUp Perú 13G (hasta S/67,000 sin equity)
  → Postular a CONCYTEC / PROCIENCIA si el componente tech es sólido

Con primeros usuarios pagos (mar-jun 2027)
  → Postular a Start-Up Chile (USD 60,000 + residencia 4 meses)
  → Considerar Y Combinator (USD 500,000, muy competitivo)

Con tracción real (2028)
  → Aceleradoras LATAM: Rockstart, Platanus Ventures
  → VCs LATAM: Kaszek, ALLVP, Magma Partners
```

---

### Opción 1 — JAKU Emprende (UNSA) ⭐ Primera parada

**Qué es:** Incubadora oficial de la Universidad Nacional de San Agustín de Arequipa. Tu propia universidad.

**Programas disponibles:**
- **Wichariy** (pre-incubación): ideas en etapa temprana, ideal para antes del MVP
- **SISAY** (incubación): para prototipos funcionales
- **IDI 2026**: para proyectos con prototipo funcional (TRL 5-7), orientado a spin-offs universitarios

**Dato clave:** JAKU está actualmente preparando equipos para postular a StartUp Perú 13G. Si te acercas ahora, puedes sumarte a esa preparación y llegar lista con el MVP.

**Cómo acercarte:** Visita `unsa.edu.pe/jaku` o preséntate directamente en su oficina en el campus UNSA.

**Costo:** Gratis para estudiantes de UNSA.

---

### Opción 2 — StartUp Perú (ProInnóvate / PRODUCE) ⭐ Financiamiento principal

**Qué es:** Programa del Ministerio de Producción que otorga capital semilla **sin equity** (no te quitan porcentaje de la empresa). Es dinero no reembolsable si cumples los hitos.

**Montos disponibles (convocatoria 13G):**

| Categoría | Monto | Para quién |
|---|---|---|
| **Emprendimientos Innovadores** | Hasta S/. 67,000 (~USD 18,000) | Idea con MVP o prototipo básico |
| **Emprendimientos Dinámicos** | Hasta S/. 140,000-150,000 (~USD 38,000) | Con tracción demostrable (usuarios, ventas) |

**Requisitos principales:**
- Equipo de 2-4 personas (mínimo, no puedes ser sola para muchas categorías)
- MVP funcional probado con usuarios reales
- Empresa constituida hace máx. 18 meses (o aún no constituida, según la categoría)
- Ventas máximas de S/. 120,000 en 2025
- Al menos 51% de los socios fundadores deben ser peruanos

**Cómo postular:** `startup.proinnovate.gob.pe`

**Estrategia:** Acércate a JAKU Emprende UNSA primero — ellos te ayudan a preparar la postulación a StartUp Perú 13G.

---

### Opción 3 — CONCYTEC / PROCIENCIA

**Qué es:** Consejo Nacional de Ciencia, Tecnología e Innovación. Para 2026 tiene S/. 73 millones en fondos concursables distribuidos en 14 convocatorias.

**Relevante para este proyecto:**
- Línea de **innovación empresarial**: desarrollo tecnológico con aplicación comercial
- Línea de **investigación aplicada**: si el componente de IA narrativa se presenta como investigación

**Más complejo de postular** que StartUp Perú. Requiere estar vinculada a una institución (UNSA puede ser esa institución). Mejor opción después de tener el MVP.

**Más información:** `prociencia.gob.pe/calendario-de-concursos`

---

### Opción 4 — Start-Up Chile ⭐ Mejor relación esfuerzo/resultado en LATAM

**Qué es:** Aceleradora del gobierno de Chile. Acepta fundadores de cualquier país de LATAM.

**Programas:**
| Programa | Monto | Para quién |
|---|---|---|
| **SEED** | USD 60,000 (equity-free) | MVP validado, primeros usuarios |
| **BUILD** | USD 100,000 | Con tracción demostrable |

**Condición:** Residir en Chile durante el programa (3-4 meses). Pagan vivienda y oficina.

**Por qué es buena opción:**
- Sin equity (no te quitan porcentaje)
- Red de contactos chilena y LATAM
- Al terminar, puedes volver a Perú con USD 60K y validación internacional

**Cómo postular:** `startupchile.org` (convocatorias periódicas)

---

### Opción 5 — Y Combinator (YC) ⭐ El más prestigioso, el más difícil

**Qué es:** La aceleradora más famosa del mundo. Ha lanzado Airbnb, Stripe, Dropbox, Twitch.

**Inversión:** USD 500,000 a cambio del 7% de la empresa.

**Por qué es relevante para este proyecto:**
- El 60% de la batch 2026 son startups de IA — el proyecto califica perfectamente
- Acepta fundadores latinoamericanos (hay precedentes de startups peruanas)
- El enfoque en "agentic workflows" es exactamente lo que construyes

**Requisitos reales (no oficiales):**
- Equipo de 2-3 personas (preferiblemente no solo-founder)
- Tracción demostrable (usuarios activos, aunque sea pequeños)
- Algo que demuestre que pueden construir (tu GitHub, proyectos previos)
- Idea con mercado grande

**Cuándo postular:** Cuando tengas el MVP funcionando con al menos 20-50 usuarios activos. La batch es dos veces al año (Summer y Winter). La próxima aplicación relevante sería Winter 2028 o Summer 2028.

**Cómo postular:** `ycombinator.com/apply`

---

### Opción 6 — Otras aceleradoras LATAM

| Aceleradora | País base | Inversión | Para cuándo |
|---|---|---|---|
| **UTEC Ventures** (Lima) | Perú | Variable | Con MVP funcional |
| **Wayra** (Telefónica) | España/LATAM | USD 50-150K | Con tracción |
| **Rockstart LATAM** | Holanda/LATAM | EUR 50-150K | Con tracción |
| **Platanus Ventures** | Chile | USD 100-200K | Con tracción |
| **Kaszek** | Argentina | USD 1M+ | A escala |
| **ALLVP** | México | USD 500K-2M | A escala |
| **Magma Partners** | Chile | USD 100-500K | Post-tracción |

---

## 5. Estimado de inversión necesaria para llegar al mercado

### MVP (meses 1-2) — Costo real: casi $0

| Gasto | Costo | Notas |
|---|---|---|
| Infraestructura (Railway, Vercel, Supabase) | $0-20/mes | Tiers gratuitos suficientes para < 50 usuarios |
| Gemini API | $0 | Tier gratuito suficiente para prototipo |
| Dominio | $12/año | |
| **Total MVP** | **~$50-100** | Tu tiempo es el recurso principal |

### V1 — Primeros pagos ($1,500-5,000 USD)

| Gasto | Estimado |
|---|---|
| Diseño UI/UX (freelancer o co-fundador) | $500-2,000 |
| Servidores con más carga (Railway paid) | $50-100/mes |
| Stripe setup | $0 (paga por transacción) |
| Marketing inicial (pruebas de anuncios) | $200-500 |
| Dominio + email corporativo | $50/año |
| **Total V1** | **~$1,500-5,000** |

Este monto lo cubre perfectamente el ProInnóvate Emprendimientos Innovadores (S/. 67,000 ≈ USD 18,000).

### Lanzamiento público V2 — ($15,000-50,000 USD)

| Gasto | Estimado |
|---|---|
| Sueldo diseñador/frontend (6 meses part-time) | $3,000-8,000 |
| Infraestructura escalada | $300-800/mes |
| Marketing y adquisición de usuarios | $2,000-5,000 |
| Legal (constitución empresa, DMCA agent) | $500-1,500 |
| Stripe Connect setup y KYC | $0 (por transacción) |
| **Total V2** | **~$15,000-50,000** |

Este monto lo cubre Start-Up Chile (USD 60K) o el tramo dinámico de ProInnóvate (S/. 140K ≈ USD 38K).

---

## 6. Dónde validar el modelo de negocio

Además del financiamiento, necesitas validar que el modelo funciona. Estas son las vías:

### Validación de usuarios (gratis)

| Método | Qué validas | Cómo |
|---|---|---|
| Entrevistas con escritores (20-30) | ¿Reconocen el problema? ¿Pagarían? | Contacto directo, grupos de Facebook de escritores |
| Landing page con waitlist | ¿Hay demanda real? | Mides % de conversión visita → registro |
| Prototipo en papel / Figma | ¿La UI tiene sentido? | Muéstralo sin haber programado nada |
| Product Hunt (cuando tengas V1) | Validación internacional | Lanza en Product Hunt — te dice si el mercado existe |

### Validación del modelo de negocio (con mentores)

| Recurso | Qué obtienes |
|---|---|
| **JAKU Emprende UNSA** | Mentores peruanos con experiencia en startups |
| **Indie Hackers** (`indiehackers.com`) | Comunidad de fundadores bootstrapped que dan feedback honesto |
| **Product Hunt Ship** | Comunidad que valida productos antes del lanzamiento |
| **r/SaaS** (Reddit) | Feedback de fundadores de SaaS globales |
| **Mentorías de ProInnóvate** | Si entras al programa, tienes acceso a mentores asignados |

---

## 7. Pasos inmediatos de emprendimiento (paralelos al desarrollo)

Mientras construyes el MVP técnico:

**Esta semana:**
- [ ] Verificar disponibilidad del nombre elegido (INDECOPI + dominio + redes)
- [ ] Crear cuenta en `ycombinator.com/cofounder-matching` (aunque sea para más adelante)
- [ ] Visitar `unsa.edu.pe/jaku` o acercarte físicamente a JAKU Emprende UNSA

**Mes 1 (paralelo al desarrollo):**
- [ ] Entrevistar a 10 escritores reales: ¿tienen el problema? ¿pagarían?
- [ ] Hacer la landing page simple con waitlist
- [ ] Empezar a construir presencia en comunidades de escritores (sin anunciar el producto todavía, solo siendo parte)

**Mes 2 (cuando el MVP esté cerca):**
- [ ] Buscar 20 beta testers con manuscritos reales
- [ ] Revisar convocatoria activa de StartUp Perú 13G (`startup.proinnovate.gob.pe`)
- [ ] Si el MVPfunciona: iniciar proceso de constitución de empresa (necesario para ProInnóvate)

**Mes 3-4 (con MVP funcionando):**
- [ ] Postular a StartUp Perú 13G (con apoyo de JAKU si ya estás en el programa)
- [ ] Publicar un demo en Twitter/LinkedIn para medir interés público
- [ ] Evaluar si buscar co-fundador (diseño UX/UI o negocio)

---

*Ver también: `estructura_proyecto.md` (plan completo) · `monetizacion.md` (modelo de ingresos) · `plan_tecnico.md` (arquitectura)*
