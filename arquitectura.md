# Especificación del Proyecto: Planificador de Viaje a Japón

## Objetivo

Construir un sitio web estático para visualizar la planificación completa de un viaje a Japón.
Nota: este archivo contiene ejemplo, no la data real del viaje.

### Requisitos principales

* Toda la información del viaje debe almacenarse en **un único archivo de texto**.
* Ese archivo será la única fuente de datos ("Single Source of Truth").
* El usuario **nunca editará HTML**.
* El sitio debe generarse automáticamente leyendo ese archivo.
* El formato debe ser fácil de editar manualmente durante la etapa de planificación.
* Debe ser posible mover días completos entre secciones simplemente cortando y pegando bloques de texto.

---

# Tecnologías

## Frontend

* HTML5
* CSS3
* TypeScript
* Sin backend
* Sin base de datos

Se puede utilizar Vite como entorno de desarrollo.

---

# Estructura del proyecto

```
/
│
├── index.html
├── css/
├── src/
│     parser.ts
│     app.ts
│     ui.ts
│     router.ts
│
├── assets/
│     fotos/
│
└── data/
      viaje.txt
```

El archivo `viaje.txt` contiene toda la información del viaje.

---

# Modelo de datos

El documento está compuesto por cuatro niveles.

```
Viaje

    Sección

        Información general

        Día

            Eventos
```

---

# Configuración del viaje

Existe una única configuración global.

Ejemplo:

```
@trip

title: Japón 2027

departure: 2027-02-14

return: 2027-03-02

timezone: Asia/Tokyo

currency: JPY
```

La fecha de salida es la referencia para calcular automáticamente:

* número de día
* fecha
* día de la semana

Ejemplo:

```
departure = 14 febrero

Día 1
Viernes 14 febrero

Día 2
Sábado 15 febrero

...

Día 18
Lunes 3 marzo
```

Las fechas de cada día NO se escriben manualmente.

---

# Secciones

El viaje posee cuatro secciones principales.

```
@section Tokyo

@section Alpes

@section Kyoto

@section Osaka
```

Cada sección contiene información general.

Ejemplo

```
@section Tokyo

title: Tokyo

hotel:
Hotel Gracery Shinjuku

summary:
Primera base del viaje.

notes:
Comprar Suica apenas llegar.
```

---

# Días

Cada sección contiene múltiples días.

Ejemplo

```
@day

title:
Harajuku y Shibuya

steps:
17000

summary:
Santuario + Takeshita Street + Nintendo + Pokémon + Mirador
```

El sitio mostrará automáticamente:

```
Día 5

Martes 18 febrero

Harajuku y Shibuya

17.000 pasos

Resumen

Santuario
Takeshita Street
Nintendo
Pokémon
Mirador
```

Cuando el día esté colapsado únicamente debe verse este resumen.

---

# Notas

Cada día puede contener una o varias notas.

Ejemplo

```
@note

No veo el Shibuya Crossing al atardecer.
```

Las notas deben visualizarse en una caja destacada.

---

# Eventos

Los eventos son el núcleo del sistema.

Cada evento posee siempre la misma estructura.

```
Hora | Duración | Tipo | Descripción
```

Ejemplo

```
08:50 | 10m | WALK |
Caminar de Hospedaje → Estación Hatagaya
```

```
09:00 | 25m | TRAIN |
Metro Hatagaya → Harajuku
vía Shinjuku
JR Yamanote
```

```
09:30 | 90m | VISIT |
Santuario Meiji

Templo sintoísta rodeado por un inmenso bosque de cedros.

Incluye Jardín Imperial Gyoen.
```

---

# Tipos de evento

El parser debe reconocer al menos:

```
WALK
TRAIN
BUS
TAXI
VISIT
FOOD
SHOP
HOTEL
PHOTO
BREAK
FREE
NOTE
```

Cada tipo puede representarse mediante un icono distinto.

---

# Restaurantes

Los restaurantes pueden existir como opciones dentro de un evento.

Ejemplo

```
13:00 | 60m | FOOD |

Almuerzo

Option

Kua'Aina

Hamburguesas hawaianas.

Option

CoCo Ichibanya

Curry japonés.
```

El sitio debe mostrarlos como alternativas claramente diferenciadas.

---

# Links

Cualquier URL debe detectarse automáticamente.

Ejemplo

```
Google Maps

https://...

Sitio web

https://...
```

Los enlaces deben visualizarse como botones.

---

# Fotos

Las fotos serán referencias a archivos locales.

Ejemplo

```
foto:
assets/fotos/shibuya.jpg
```

El sitio debe generar una galería automáticamente.

---

# Navegación

La barra lateral debe mostrar:

```
Tokyo

    Día 1

    Día 2

    Día 3

Alpes

    Día 4

    Día 5

Kyoto

...

Osaka

...
```

Las secciones deben poder expandirse y contraerse.

---

# Vista de un día

Cada día debe incluir:

* número del día
* fecha calculada
* día de la semana
* título
* pasos estimados
* resumen
* notas
* línea de tiempo
* eventos
* fotos
* enlaces

---

# Línea de tiempo

Los eventos deben visualizarse cronológicamente.

Ejemplo

```
🚶 08:50

🚇 09:00

⛩️ 09:30

🛍️ 11:00

🍜 13:00

🎮 14:30

🌇 17:30

🍲 19:00

🚇 20:30
```

---

# Funcionalidades

El sitio debe incluir:

* navegación por secciones
* navegación por días
* expandir/colapsar secciones
* expandir/colapsar días
* scroll automático al día seleccionado
* buscador de texto
* modo oscuro
* diseño responsive
* galería de imágenes
* botones para Google Maps
* botones para sitios web
* navegación "día anterior / siguiente"

---

# Vista "Hoy"

El sitio debe tener una vista especial llamada "Hoy".

Usando la fecha de salida y la fecha actual debe calcular automáticamente qué día del itinerario corresponde.

Ejemplo

```
Hoy

Martes 18 febrero

Día 5

Harajuku y Shibuya
```

Si la fecha actual es anterior al viaje, debe mostrar el Día 1.

Si el viaje terminó, debe mostrar el último día o un mensaje indicando que el itinerario ha finalizado.

---

# Objetivos de diseño

El sitio debe ser:

* extremadamente rápido
* completamente estático
* fácil de mantener
* fácil de editar
* sin duplicación de información
* orientado a dispositivos móviles
* agradable visualmente
* con una interfaz moderna y limpia
* optimizado para consultar durante el viaje

---

# Objetivos del parser

El parser debe:

* leer el archivo completo
* validar la estructura
* convertir el texto en un modelo de datos interno
* generar automáticamente la interfaz
* tolerar líneas vacías
* producir mensajes de error claros cuando exista un formato inválido

El usuario debe poder reorganizar días completos moviendo bloques de texto sin necesidad de modificar ninguna otra parte del documento.

