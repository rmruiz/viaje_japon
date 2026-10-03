# docs.md — Planificador de Viaje a Japón 2026

Sitio web estático para visualizar la planificación y el seguimiento del viaje a Japón (15 de febrero – 15 de marzo de 2026). Toda la información del itinerario vive en un único archivo de texto plano (`public/viaje.txt`) que se parsea y renderiza en el navegador al cargar la página. No hay backend, base de datos ni estado persistente: el viaje es "código de contenido" editable a mano.
El directorio `public/images/` tiene archivos jpg referenciados desde viaje.txt.

## 1. Estructura del archivo `public/viaje.txt`

El archivo usa una sintaxis propia basada en **tags con `@`** y líneas `clave: valor`. El parser (`src/parser.ts`) lo procesa línea a línea como una máquina de estados. 
Conteo actual: 31 días, 4 secciones (bases), 447 eventos, 65 opciones, 15 notas y 89 imágenes referenciadas.

### 1.1 Jerarquía

```
@trip                 → Configuración global del viaje (una sola vez, al inicio)
└── @section <Nombre> → Base / etapa del viaje (Tokio, Alpes, Kioto, Osaka)
    └── @day          → Un día de itinerario (numerado en orden de aparición)
        ├── @note     → Notas / avisos del día (pueden ir antes de los eventos)
        ├── HH:MM | dur | TIPO | …   → Evento (repeticiones = cronograma)
        │   ├── (líneas de descripción del evento)
        │   └── Option / Opción      → Alternativas del evento
        └── (líneas de descripción de eventos, URLs, etc.)
```

### 1.2 `@trip` — Configuración global

Líneas `clave: valor` reconocidas:

| Clave       | Ejemplo             | Uso en el sitio                                                        |
|-------------|---------------------|------------------------------------------------------------------------|
| `title`     | `Japón — Itinerario Reestructurado` | Se parsea, pero no se muestra en la UI               |
| `departure` | `2026-02-15`        | Origen de todas las fechas de día (`YYYY-MM-DD`)                       |
| `return`    | `2026-03-15`        | Comparada contra la suma de días (`departure + N`) → advertencia si no coincide |
| `timezone`  | `Asia/Tokyo`        | Se parsea, sin uso en la UI                                            |
| `currency`  | `JPY`               | Se parsea, sin uso en la UI                                            |

Los días **no llevan fecha explícita**: el parser asigna `Día N = departure + N días`, calculado en UTC (para evitar desfases por zona horaria local) y formateado en español (`Lunes 16 de febrero de 2026`). El modelo refleja la realidad del viaje: la salida es desde Santiago, el vuelo dura 2 días y la llegada a Japón (**Día 1**) es el día siguiente de la salida; por tanto el último día (Día N) cae en `departure + N`, que es la **fecha de regreso esperada** (`TripData.expectedReturn`), usada por la advertencia de consistencia (ver §3.5). Si un día aparece antes del `@trip` en el archivo, las fechas se recalculan al final del parseo.

### 1.3 `@section <Nombre>` — Bases

El nombre va en la misma línea del tag. El `id` interno se genera como `section-<nombre-en-minusculas-sin-especiales>` (p. ej. `section-tokio`). Claves reconocidas:

| Clave     | Uso en el sitio                                              |
|-----------|--------------------------------------------------------------|
| `title:`  | Título completo de la tarjeta de sección (p. ej. `BASE 1 — TOKIO (Shinjuku)`) |
| `hotel:`  | Alojamiento, mostrado como `🏨 Alojamiento:` en la tarjeta de sección |
| `summary:`| Descripción de la base, con soporte de enlaces inline        |
| `notes:`  | Se parsea, pero **no se renderiza** en la UI                 |

La tarjeta de sección aparece una sola vez antes del primer día de esa base (se oculta al buscar o al ordenar por estrellas).

### 1.4 `@day` — Días

Claves reconocidas:

| Clave    | Ejemplo                                                    | Uso                                            |
|----------|------------------------------------------------------------|------------------------------------------------|
| `stars:` | `5`                                                        | Calificación 0–5 → estrellas en el encabezado y filtro |
| `title:` | `Ueno y Akihabara`                                         | Título del día                                 |
| `steps:` | `17500`                                                    | Pasos estimados → badge `👟` y en la barra "Hoy" |
| `summary:`| `Museo Nacional de Tokio + Parque Ueno…`                   | Subtítulo bajo el título (soporta enlaces inline) |
| `image1:` … `imageN:` (o `foto:` / `fotos:`) | `museonacional.png [Museo Nacional de Tokio en Ueno]` | Imágenes del día (ver §1.9) |

Detalles:
- El **número de día** es el contador global de `@day` (no por sección): `Día 1`, `Día 2`, … y el `id` interno es `day-1`, `day-2`, … (usado por el router por hash).
- Un `@day` fuera de cualquier `@section` se asigna a una sección virtual `section-general`.
- Las líneas desconocidas dentro de un día se **ignoran** en silencio (p. ej. una URL suelta).

### 1.5 Eventos — línea de encabezado de cronograma

Cada evento comienza con una línea que debe coincidir con la regex del parser:

```
HH:MM | <duración> | <TIPO> | <descripción opcional>
^(\d{1,2}:\d{2})\s*\|\s*(\d+[mh]?)\s*\|\s*([A-Z_]+)\s*\|(.*)$
```

- **Hora** `HH:MM`: se normaliza a 5 caracteres (`7:05` → `07:05`).
- **Duración**: número + sufijo opcional `m`/`h` (p. ej. `90m`, `2h`, `15`).
- **TIPO**: mayúsculas, subrayado permitido. Tipos con icono y color propios (resto → `📍` / estilo `type-visit`):

| Tipo    | Icono | Color (badge) |
|---------|-------|----------------|
| `WALK`  | 🚶 | verde esmeralda |
| `TRAIN` | 🚇 | azul |
| `BUS`   | 🚌 | ámbar |
| `TAXI`  | 🚕 | amarillo |
| `VISIT` | ⛩️ | púrpura |
| `FOOD`  | 🍜 | rojo/rosa |
| `SHOP`  | 🛍️ | rosa |
| `HOTEL` | 🏨 | teal |
| `PHOTO` | 📸 | violeta |
| `BREAK` | ☕ | gris |
| `FREE`  | 🎮 | verde |
| `NOTE`  | 📝 | naranja |

Distribución actual en el archivo: 173 `WALK`, 73 `TRAIN`, 66 `VISIT`, 60 `FOOD`, 18 `BUS`, 17 `SHOP`, 16 `BREAK`, 9 `HOTEL`, 7 `PHOTO`, 5 `TAXI`, 3 `FREE`.

- **Descripción**: todo lo que va después del tercer `|` en la misma línea (habitualmente vacío en este archivo), más todas las líneas que siguen hasta el siguiente evento, `Option`, `@note`, `@day` o `@section`.
- Convención del contenido: costos entre paréntesis como `(CLP 1.2M)` o `(~10 USD)` se escriben directamente en la descripción.

### 1.6 `Option` / `Opción` — Alternativas de un evento

Dentro del bloque de un evento, la palabra exacta `Option` (o `Opción`) en su línea inicia una alternativa:

```
Option
Tonkatsu Marugo          ← primera línea = título
A 4 min desde Mandarake. ← resto = descripción (multilínea)
```

Se renderiza como tarjetas `🍴` bajo el evento (típico: alternativas de restaurante para almuerzo/cena).

### 1.7 `@note` — Notas del día

```
@note
Todo el texto de la nota, que puede
ocupar varias líneas y contener enlaces inline.
```

- Termina en la siguiente línea que sea evento, tag o `Option`.
- Se renderiza como cajas `📌` entre las imágenes y el cronograma del día.
- Soporta el mismo procesado de enlaces que las descripciones.

### 1.8 Enlaces y Google Maps en el texto

Durante el finalizado de cada evento/nota/summary, el parser procesa las URLs del texto:

1. **URLs de Google Maps** (`google.com/maps`, `maps.google.com`, `maps.app.goo.gl`) → se extraen a `mapUrl` del evento y se **quitan del texto**. Convierten el badge de duración en un botón `🗺️ <duración>` clicable que abre el panel de mapas (ver §2.4).
2. **Enlaces inline personalizados** `[url|etiqueta]` → se convierten en `<a>` dentro del texto (p. ej. `[https://www.getyourguide.com/…|getyourguide]` muestra solo "getyourguide").
3. **Cualquier otra URL** → se recopila como chip `🔗 Ver enlace` (o con su etiqueta, si venía en forma inline) bajo el evento.

### 1.9 Imágenes de día

```
image1: museonacional.png [Museo Nacional de Tokio en Ueno]
```

- Claves: `image1`…`imageN` (también `foto:`/`fotos:`), una por línea.
- Formato: `archivo.png [etiqueta opcional]`. La etiqueta se usa como `alt`/caption y como consulta de búsqueda.
- Rutas: se normalizan a `/images/<archivo>` (directorio `public/images/`); se aceptan rutas absolutas, con prefijo `images/` o URLs `http(s)`.
- Las miniaturas se muestran **solo cuando la tarjeta del día está colapsada** (comportamiento del UI, ver §2.3).

### 1.10 Reglas de tolerancia del parser

- Líneas en blanco delimitan blocos visualmente, pero el parser se guía solo por tags, encabezados de evento y `Option`.
- Cualquier línea que no coincida con la sintaxis del modo actual se descarta sin error.
- Todo el texto (títulos, summaries, descripciones) pasa por `parseInlineLinks`, así que `[url|etiqueta]` funciona en casi todo el archivo.

---

## 2. Arquitectura y tecnología del sitio

### 2.1 Stack

| Componente     | Tecnología                                                              |
|----------------|--------------------------------------------------------------------------|
| Build tool     | **Vite 5** (`vite dev` en puerto 3000, `vite build` → `dist/`)           |
| Lenguaje       | **TypeScript 5** (ES Modules, sin framework)                             |
| UI             | HTML + CSS + **DOM vanilla** (sin React/Vue; renderizado por templates de strings) |
| Datos          | `fetch('/viaje.txt')` sobre archivo estático (fallback `./viaje.txt`)    |
| Estilos        | `css/style.css` (un solo archivo, variables CSS, tema oscuro por defecto)|
| Tipografía     | Inter (Google Fonts)                                                     |
| Deploy         | **Firebase Hosting** (`firebase.json` → `public: dist` + rewrite SPA a `/index.html`) |
| Dependencias   | Solo `vite`, `typescript` y `lucide` (lista pero **sin uso** en el código) |

Es una **SPA de un solo archivo de datos**: el único "estado" global es el objeto `TripData` parseado en memoria.

### 2.2 Estructura de archivos

```
index.html          → Layout estático: header, sidebar, columna de días, panel de mapas
css/style.css       → ~1.300 líneas: layout, tarjetas, timeline, temas, responsive
public/viaje.txt    → Fuente de datos (ver §1)
public/images/      → 95 PNGs de los días
src/types.ts        → Interfaces: TripData, Section, Day, TripEvent, EventOption, DayNote, DayImage, TripConfig
src/parser.ts       → parseTripData(): máquina de estados viaje.txt → TripData
src/app.ts          → initApp(): carga datos, eventos del DOM, panel de mapas, tema
src/ui.ts           → renderSidebar / renderHoyBanner / renderMainContent / renderDayCard + fallback de imágenes
src/router.ts       → Router por hash (#day-N, #hoy)
vite.config.ts      → puerto 3000, publicDir: public
firebase.json       → Hosting (dist) con rewrite de SPA
```

### 2.3 Flujo de datos

```
viaje.txt ──fetch──▶ parseTripData() ──▶ TripData { config, sections[], allDays[] }
                                                    │
                     ┌──────────────────────────────┼───────────────────────────────┐
                     ▼                              ▼                               ▼
             renderSidebar()                renderHoyBanner()              renderMainContent()
             (acordeones sección→días)      (banner "Hoy en Japón")         (tarjetas de día + timeline)
```

- Cada filtro/búsqueda **re-renderiza** el contenido principal completo a partir de `TripData` (reconstrucción de `innerHTML`); el conjunto de días expandidos se conserva en un `Set<string>` para no perder el estado del usuario.
- `allDays` es la lista aplanada en orden cronológico; cada `Day` guarda `sectionId`/`sectionTitle` para localizar su base.

### 2.4 Módulo `app.ts` — orquestación

Responsabilidades principales:

- **Carga**: `fetch('/viaje.txt')` → fallback `./viaje.txt` → `parseTripData`. Si falla, muestra un estado de error en el contenido principal.
- **Panel de mapas**: al pulsar el badge `🗺️ <duración>` de un evento (delegación de eventos en el contenedor principal), `convertToEmbedUrl()` convierte la URL de Google Maps en una URL embebible:
  - `/dir/Origen/Destino` → `https://maps.google.com/maps?saddr=…&daddr=…&output=embed` (filtra segmentos `@…`/`data=…` de las URLs de Maps).
  - `/place/Lugar` → `https://maps.google.com/maps?q=…&output=embed`.
  - Fallback: `?q=<url-completa>&output=embed`.
  - Se inyecta un `<iframe loading="lazy">` en la columna derecha, con enlace "Abrir en Maps ↗" hacia la URL original. El panel se oculta con el botón ×, clic en el fondo o tecla `Escape` (clase `maps-hidden` en el layout). En pantallas ≤ 1050px hace scroll automático hasta el panel.
- **Tema oscuro/claro**: toggle en el header; se aplica el atributo `data-theme` en `<html>` y se persiste en `localStorage('theme')`. Por defecto `dark`.
- **Sidebar**: en escritorio colapsa/expande (preferencia en `localStorage('sidebarCollapsed')`); en móvil (≤ 900px) funciona como drawer.
- **Hash router** (ver §3.6).
- **Búsqueda y filtros** (ver §3.3): cada `input`/`change` vuelve a llamar `renderMainContent` con los parámetros actuales.

### 2.5 Módulo `parser.ts` — detalles

- **Máquina de estados** con modos `TRIP | SECTION | DAY | NOTE | EVENT | OPTION`, y funciones `finalize*()` en cascada (cambiar de contexto cierra el bloque abierto: opción → evento → nota → día → sección).
- `addDaysToDate()` calcula fecha + nombre de día/mes en español usando `Date.UTC` (inmune a la zona horaria del dispositivo); aplica `Día N = departure + N` (el Día 1 es la llegada, día siguiente de la salida desde Santiago). También expone `formatDateStr()` para formatear un `YYYY-MM-DD` a texto en español.
- Al terminar el parseo, las fechas de todos los días se **recalculan** con el `departure` definitivo (seguridad por orden de aparición).
- Al final se calcula `expectedReturn = departure + allDays.length`, que alimenta la advertencia de fecha de regreso (ver §3.5).
- `extractUrls()` distingue enlaces de Maps (excluidos de los chips) de cualquier otro enlace (chips `🔗`, texto "Ver enlace").
- `parseInlineLinks()` convierte `[url|etiqueta]` en anclas con `target="_blank" rel="noopener noreferrer"`.
- Valores por defecto de config si falta `@trip`: título "Viaje a Japón", 2026-02-15 → 2026-03-15, `Asia/Tokyo`, `JPY`.

### 2.6 Módulo `ui.ts` — renderizado

- `renderSidebar`: acordeón por sección (nombre + badge `N días`) con lista de días (`Día N: título`, día de la semana y pasos). El día activo según el hash se resalta.
- `renderHoyBanner`: compara la fecha actual con `departure` (offset en días enteros; 0 = día de la salida desde Santiago) y muestra 4 estados:
  - Antes de la salida: "Faltan X días para la salida desde Santiago" + Día 1 (llegada).
  - Día de la salida: "Hoy sales de Santiago. El Día 1 (llegada a Japón) es mañana, <fecha>".
  - Durante: "Hoy es el Día N de tu itinerario en Japón" + día correspondiente.
  - Después del último día: "¡El viaje ha finalizado!" + último día.
  - Muestra estadísticas (número de día, día de semana, pasos estimados).
- `renderDayCard`: plantilla de tarjeta de día completa (encabezado, imágenes, notas, timeline, navegación).
- `renderReturnWarning`: muestra la advertencia de fecha de regreso inconsistente (ver §3.5); no renderiza nada si las fechas coinciden.
- `renderMainContent`: aplica búsqueda → filtro de estrellas → orden, y arma el HTML concatenando tarjetas de sección (en orden cronológico) y tarjetas de día.
- Fallback de imágenes: `onerror` → `createMissingImagePlaceholder()` dibuja en un `<canvas>` (520×340, respetando el tema actual) un marcador rojo "FALTA IMAGEN" con el nombre del archivo, y lo usa como `dataURL`.

---

## 3. Lógica y características de visualización

### 3.1 Layout general

Tres zonas (todas definidas en `index.html`):

```
┌────────────────────────────────────────────────────────────────┐
│ Header fijo: ☰ sidebar · 🌸 Japón 2026 · 🔍 búsqueda · 📅 Hoy · tema │
├───────────────┬──────────────────────────────┬─────────────────┤
│  Sidebar      │  Columna central de días      │  Columna de     │
│  (300px)      │  · control-bar (⭐ filtro,    │  mapas (iframe  │
│  secciones y  │    ⇅ orden)                   │  Google Maps)   │
│  días         │  · hoy-banner                 │  (oculta hasta  │
│  (drawer      │  · tarjetas de día            │   primer clic)  │
│   en móvil)   │                               │                 │
└───────────────┴──────────────────────────────┴─────────────────┘
```

### 3.2 Tarjeta de día (estado colapsado vs expandido)

- **Todos los días nacen colapsados** (`expandedDayIds` vacío). Clic en el encabezado expande/colapsa (icono ▼/▲).
- **Encabezado** (siempre visible): badge `Día N`, calificación en estrellas (★ rellenas/vacías), fecha formateada, badge de base `🏠 <sección>` (solo al ordenar por estrellas o en búsqueda), título + resumen, badge de pasos `👟`, flecha de colapso.
- **Fila de imágenes**: visible **solo colapsado** — las miniaturas con caption; clic abre **búsqueda de Google Imágenes** con la etiqueta (o el título del día) como consulta. Imágenes que no cargan → placeholder canvas "FALTA IMAGEN".
- **Notas** `📌`: visibles en ambos estados (justo debajo de las imágenes).
- **Cuerpo expandido**: sección `⏱️ Itinerario y Cronograma` con el timeline de eventos + pie de navegación.
- **Navegación entre días**: enlaces `← Día N: título` / `Día N: título →` que saltan por hash a la tarjeta vecina (y la expanden).

### 3.3 Timeline de eventos

Cada evento se pinta como una fila en línea de tiempo:

- **Marcador** con emoji del tipo sobre un punto de color por tipo (variables CSS `--badge-*`), conectado por la línea vertical de la timeline.
- **Encabezado**: `⏰ HH:MM`, badge de duración (clicable `🗺️` si el evento tiene URL de Maps), badge de tipo en mayúsculas con su color.
- **Descripción** con enlaces inline y chips de enlaces (`🔗` / `🗺️ Google Maps`).
- **Opciones** (`Option`): tarjetas `🍴` con título y descripción.

### 3.4 Búsqueda, filtro y ordenamiento

Barra de controles sobre las tarjetas:

- **Búsqueda** (header): filtra días por coincidencia (mayúsculas/miniúsculas indistintas) en `title`, `summary`, descripciones de eventos y títulos de opciones. Con búsqueda activa: los días coincidentes se **expanden automáticamente** y las tarjetas de sección se ocultan.
- **Filtro por estrellas** (`⭐`): solo días con calificación ≥ N.
- **Orden** (`⇅`):
  - `cron` — cronológico (orden natural por `dayNumber`).
  - `stars` — de mayor a menor estrellas, con `dayNumber` como desempate (orden estable); oculta las tarjetas de sección y muestra el badge `🏠 base` en cada día para no perder el contexto.
- Sin resultados → estado vacío "No se encontraron resultados".

### 3.5 Advertencia de fecha de regreso (consistencia del itinerario)

En la parte superior del contenido principal (sobre el banner "Hoy") el sitio muestra una advertencia si la fecha `return` configurada **no es la misma que la suma de los días configurados**:

- **Fecha de regreso esperada** = `departure + N días` (N = cantidad de `@day`). Como el viaje dura 2 días desde Santiago (se llega a destino al día siguiente de la salida, Día 1 = departure + 1), el último día (Día N) cae en `departure + N`: es el día en que se sale de Japón.
- **Cuando se dispara**: `return ≠ departure + N`. Con el archivo actual: `2026-02-15` + 31 días = `2026-03-18`, mientras `return: 2026-03-15` → la advertencia aparece.
- **Qué muestra**: la fecha de regreso configurada, la fecha de salida, el total de días, la fecha esperada y las fechas del Día 1 y del Día N, todas en español.
- **Cuando no se dispara**: `return = departure + N` → el contenedor `#return-warning-container` queda vacío.
- Implementación: `renderReturnWarning()` (`src/ui.ts`) sobre `TripData.expectedReturn` (calculado en el parser); estilo ámbar `.return-warning` en `css/style.css`, adaptado al tema claro.

### 3.6 Navegación por hash (router)

- `#day-N` → expande la tarjeta del día, hace scroll y resalta el elemento en el sidebar (con `id="side-item-day-N"`). Funciona al cargar la página con hash y al pulsar enlaces internos.
- `#hoy` → scroll suave hasta el banner "Hoy en Japón".
- Botón `📅 Hoy` del header → fija `#hoy` y re-renderiza el banner.

### 3.7 Panel de mapas (Google Maps embebido)

- Inicialmente oculto (clase `maps-hidden` en el layout de dos columnas).
- Se abre al pulsar el badge de duración de cualquier evento que tenga URL de Google Maps en su descripción.
- Muestra el `<iframe>` de Maps en modo embebido (ruta origen→destino o lugar), un enlace para abrir la URL original en una pestaña y controles de cierre (× / clic en fondo / `Escape`).
- No guarda el último mapa: al recargar la página el panel vuelve a estar oculto.

### 3.8 Estado persistente (localStorage)

| Clave                  | Contenido                          |
|------------------------|------------------------------------|
| `theme`                | `dark` / `light`                   |
| `sidebarCollapsed`     | `true` / `false`                   |

No hay otra persistencia (búsqueda, filtros, días expandidos y mapa vivo en memoria).

### 3.9 Responsive

- **≤ 900px**: el sidebar pasa a drawer (transformación `translateX(-100%)`, se abre con ☰, se cierra al elegir un día); el contenido ocupa el ancho completo.
- **≤ 600px**: ajustes finos de densidad (padding, tipografía, controles).
- **≤ 1050px**: al cargar un mapa, el panel hace scroll automático para que el usuario lo vea.

### 3.10 Temas

- **Oscuro (defecto)**: fondo `#0f172a`, acento `#38bdf8`→`#818cf8` (gradiente), cards translúcidas con `backdrop-filter: blur`.
- **Claro**: `[data-theme="light"]` redefine todas las variables (`#f8fafc` fondo, textos `#0f172a`).
- La paleta de badges por tipo de evento es la misma en ambos temas.

---

## 4. Notas de implementación (conocidas)

- `lucide` está en `package.json` pero no se importa en ningún módulo.
- `config.title`, `config.currency`, `config.timezone` y `section.notes` se parsean pero no se visualizan.
- El cálculo de "viaje finalizado" del banner Hoy usa el **número total de días** (`allDays.length`), no la fecha `return`.
- Una URL de Maps encontrada dentro de una descripción se asocia al evento; si hay varias, se usa la primera y se eliminan del texto solo la(s) coincidente(s).
- El parser no valida la sintaxis: líneas mal formadas se ignoran; un `@day` sin `title:` queda con el título por defecto `Día N`.
- Despliegue: `npm run build` y luego `firebase deploy`; el rewrite de `firebase.json` garantiza que cualquier ruta sirve `index.html` (necesario p. ej. para recargar en rutas con hash).
