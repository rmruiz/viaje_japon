import { TripConfig, Section, Day, DayVariant, TripEvent, EventOption, DayNote, TripData, ItinerarySection } from './types';

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAY_NAMES_ES = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

export function formatDateStr(dateStr: string): string {
  const parts = dateStr.trim().split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
  return `${WEEKDAY_NAMES_ES[d.getUTCDay()]} ${d.getUTCDate()} de ${MONTH_NAMES_ES[d.getUTCMonth()].toLowerCase()} de ${d.getUTCFullYear()}`;
}

export function addDaysToDate(baseDateStr: string, daysToAdd: number): { dateStr: string; formatted: string; weekday: string } {
  // Parse YYYY-MM-DD in UTC/local safely
  const parts = baseDateStr.trim().split('-');
  if (parts.length !== 3) {
    return { dateStr: baseDateStr, formatted: baseDateStr, weekday: '' };
  }

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const day = parseInt(parts[2], 10);

  const d = new Date(Date.UTC(year, month, day));
  d.setUTCDate(d.getUTCDate() + daysToAdd);

  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  return { dateStr, formatted: formatDateStr(dateStr), weekday: WEEKDAY_NAMES_ES[d.getUTCDay()] };
}

export function parseInlineLinks(text: string): string {
  const customLinkRegex = /\[(https?:\/\/[^|\]\s]+)\|([^\]]+)\]/g;
  return text.replace(customLinkRegex, (_, url, label) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="custom-inline-link">${label}</a>`;
  });
}

export function extractUrls(text: string): { text: string; url: string }[] {
  const customLinkRegex = /\[(https?:\/\/[^|\]\s]+)\|([^\]]+)\]/g;
  const links: { text: string; url: string }[] = [];
  
  let match;
  const tempRegex = new RegExp(customLinkRegex);
  while ((match = tempRegex.exec(text)) !== null) {
    const url = match[1].trim();
    const label = match[2].trim();
    if (!url.includes('google.com/maps') && !url.includes('maps.app') && !url.includes('maps.google.com')) {
      links.push({
        text: label,
        url: url
      });
    }
  }

  const cleanedText = text.replace(customLinkRegex, '');
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const standardMatches = cleanedText.match(urlRegex);
  if (standardMatches) {
    standardMatches
      .filter(url => !url.includes('google.com/maps') && !url.includes('maps.app') && !url.includes('maps.google.com'))
      .forEach(url => {
        let cleanUrl = url.trim();
        if (cleanUrl.endsWith(']')) cleanUrl = cleanUrl.slice(0, -1);
        links.push({
          text: 'Ver enlace',
          url: cleanUrl
        });
      });
  }

  return links;
}

function normalizeImagePath(filename: string): string {
  const clean = filename.trim();
  if (!clean) return '';
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
  if (clean.startsWith('/')) return clean;
  if (clean.startsWith('images/')) return `/${clean}`;
  return `/images/${clean}`;
}

export function parseTripData(rawText: string): TripData {
  const lines = rawText.split(/\r?\n/);

  const config: TripConfig = {
    title: 'Viaje a Japón',
    departure: '2026-02-15',
    return: '2026-03-15',
    timezone: 'Asia/Tokyo',
    currency: 'JPY'
  };

  const sections: Section[] = [];
  const allDays: Day[] = [];

  let currentSection: Section | null = null;
  let currentDay: Day | null = null;
  let currentEvent: TripEvent | null = null;
  let currentOption: EventOption | null = null;
  let currentNote: DayNote | null = null;

  let mode: 'NONE' | 'TRIP' | 'ITINERARY' | 'SECTION' | 'DAY' | 'NOTE' | 'EVENT' | 'OPTION' = 'NONE';

  let totalDayCounter = 0;

  // @itinerary: orden canónico de secciones y días. null = el archivo no lo define.
  let itinerary: ItinerarySection[] | null = null;
  let currentItinerarySection: ItinerarySection | null = null;

  // Opciones de día (`option: A` / `option: B`): los bloques @day con el mismo título y
  // distinta opción son un solo día con varias variantes (ver finalizeDay / applyDayVariants).
  let currentDayOption: string | undefined;
  let currentDayStartLine = 0;
  let currentDayTitleLine = 0;
  interface FileDayEntry {
    day: Day;                       // primer bloque @day con ese título (es el día que se conserva)
    lines: number[];                // línea del título de cada bloque (para mensajes de error)
    keys: Map<string, number>;      // etiqueta de opción -> línea del título
    hasPlain: boolean;              // el primer bloque no tenía `option:`
    variants: DayVariant[];         // una por bloque con `option:`
  }
  const fileDayEntries = new Map<string, FileDayEntry>();

  // Detección de títulos de sección repetidos (error fatal al cargar la página).
  const fileSectionNameLines = new Map<string, number[]>();
  const itinDayTitleLines = new Map<string, number[]>();
  const itinSectionNameLines = new Map<string, number[]>();

  function trackDuplicate(titleMap: Map<string, number[]>, value: string, lineNo: number, what: string, where: string) {
    const seen = titleMap.get(value);
    if (seen) {
      throw new Error(`${what} duplicado en ${where}: "${value}" (líneas ${seen.join(' y ')} y ${lineNo}). Cada ${what.toLowerCase()} debe ser único.`);
    }
    titleMap.set(value, [lineNo]);
  }

  function finalizeOption() {
    if (currentOption && currentEvent) {
      currentOption.title = currentOption.title.trim();
      currentOption.description = currentOption.description.trim();
      if (!currentEvent.options) {
        currentEvent.options = [];
      }
      currentEvent.options.push(currentOption);
      currentOption = null;
    }
  }

  function finalizeEvent() {
    finalizeOption();
    if (currentEvent && currentDay) {
      let desc = currentEvent.description.trim();

      // Extract Google Maps URL if present
      const mapMatch = desc.match(/(https?:\/\/(www\.)?(google\.com\/maps|maps\.app\.goo\.gl|maps\.google\.com)[^\s]+)/i);
      if (mapMatch) {
        currentEvent.mapUrl = mapMatch[0];
        // Strip out raw Google Maps URL from description text
        desc = desc.replace(mapMatch[0], '').trim();
      }

      currentEvent.links = extractUrls(desc);
      currentEvent.description = parseInlineLinks(desc);

      currentDay.events.push(currentEvent);
      currentEvent = null;
    }
  }

  function finalizeNote() {
    if (currentNote && currentDay) {
      const content = currentNote.content.trim();
      if (content) {
        currentNote.content = parseInlineLinks(content);
        currentDay.notes.push(currentNote);
      }
      currentNote = null;
    }
  }

  function finalizeDay() {
    finalizeNote();
    finalizeEvent();
    if (currentDay) {
      currentDay.title = currentDay.title.trim();
      currentDay.summary = parseInlineLinks(currentDay.summary.trim());

      const title = currentDay.title;
      const titleLine = currentDayTitleLine || currentDayStartLine;
      const entry = fileDayEntries.get(title);
      if (!entry) {
        // Primer bloque con este título: es el día (los siguientes con `option:` solo le suman variantes).
        const created: FileDayEntry = {
          day: currentDay,
          lines: [titleLine],
          keys: new Map(),
          hasPlain: !currentDayOption,
          variants: []
        };
        if (currentDayOption) {
          created.keys.set(currentDayOption, titleLine);
          created.variants.push(variantOf(currentDay, currentDayOption));
        }
        fileDayEntries.set(title, created);
        allDays.push(currentDay);
        if (currentSection) {
          currentSection.days.push(currentDay);
        }
      } else {
        // Título repetido: solo es válido si todos los bloques son opciones distintas del mismo día.
        if (!currentDayOption || entry.hasPlain) {
          throw new Error(`Título de día duplicado en el archivo: "${title}" (líneas ${entry.lines.join(', ')} y ${titleLine}). Cada título debe ser único, salvo que sean opciones del mismo día: todos los bloques @day con ese título deben llevar \`option:\` (A, B…).`);
        }
        if (entry.keys.has(currentDayOption)) {
          throw new Error(`Opción duplicada en el archivo: el día "${title}" define la opción ${currentDayOption} dos veces (líneas ${entry.keys.get(currentDayOption)} y ${titleLine}).`);
        }
        entry.keys.set(currentDayOption, titleLine);
        entry.lines.push(titleLine);
        entry.variants.push(variantOf(currentDay, currentDayOption));
      }
      currentDay = null;
      currentDayOption = undefined;
    }
  }

  function finalizeSection() {
    finalizeDay();
    if (currentSection) {
      currentSection.title = currentSection.title.trim();
      if (currentSection.hotel) currentSection.hotel = currentSection.hotel.trim();
      if (currentSection.summary) currentSection.summary = parseInlineLinks(currentSection.summary.trim());
      if (currentSection.notes) currentSection.notes = parseInlineLinks(currentSection.notes.trim());
      sections.push(currentSection);
      currentSection = null;
    }
  }

  // Regex for event header: HH:MM | Duration | Type | Optional Description
  // Example: 17:15 | 90m | HOTEL | Aterrizaje en Haneda...
  const eventHeaderRegex = /^(\d{1,2}:\d{2})\s*\|\s*(\d+[mh]?)\s*\|\s*([A-Z_]+)\s*\|(.*)$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Modo ITINERARY: `section: <nombre>` abre una sección; las siguientes líneas no vacías
    // hasta la línea en blanco son títulos de día. Cualquier tag @ cierra el itinerario.
    if (mode === 'ITINERARY' && !trimmed.startsWith('@')) {
      if (trimmed.startsWith('section:')) {
        const sectionName = trimmed.replace('section:', '').trim();
        if (sectionName) {
          trackDuplicate(itinSectionNameLines, sectionName, i + 1, 'Nombre de sección', 'el itinerario');
          currentItinerarySection = { name: sectionName, dayTitles: [] };
          (itinerary as ItinerarySection[]).push(currentItinerarySection);
        }
        continue;
      }
      if (trimmed === '') {
        currentItinerarySection = null;
        continue;
      }
      if (currentItinerarySection) {
        trackDuplicate(itinDayTitleLines, trimmed, i + 1, 'Título de día', 'el itinerario');
        currentItinerarySection.dayTitles.push(trimmed);
      }
      // Líneas fuera de toda sección (o un `section:` sin nombre) se descartan.
      continue;
    }

    if (mode === 'ITINERARY') {
      // Un tag cierra el itinerario; el tag se procesa en la lógica siguiente.
      mode = 'NONE';
      currentItinerarySection = null;
    }
    if (trimmed.startsWith('@trip')) {
      finalizeSection();
      mode = 'TRIP';
      continue;
    }

    if (trimmed.startsWith('@itinerary')) {
      finalizeSection();
      mode = 'ITINERARY';
      itinerary = [];
      currentItinerarySection = null;
      continue;
    }

    if (trimmed.startsWith('@section')) {
      finalizeSection();
      mode = 'SECTION';
      const sectionName = trimmed.replace(/^@section\s*/, '').trim() || 'Sección';
      trackDuplicate(fileSectionNameLines, sectionName, i + 1, 'Nombre de sección', 'el archivo');
      const sectionId = `section-${sectionName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      currentSection = {
        id: sectionId,
        name: sectionName,
        title: sectionName,
        days: []
      };
      continue;
    }

    if (trimmed.startsWith('@day')) {
      finalizeDay();
      mode = 'DAY';
      totalDayCounter++;
      currentDayOption = undefined;
      currentDayStartLine = i + 1;
      currentDayTitleLine = 0;
      
      const dayNumber = totalDayCounter;
      // Día N = departure + N días: el Día 1 es la llegada a Japón, al día siguiente de la salida desde Santiago.
      const { dateStr, formatted, weekday } = addDaysToDate(config.departure, dayNumber);
      
      const sectionId = currentSection ? currentSection.id : 'section-general';
      const sectionTitle = currentSection ? currentSection.name : 'General';

      currentDay = {
        id: `day-${dayNumber}`,
        dayNumber,
        dateStr,
        dateFormatted: formatted,
        dayOfWeek: weekday,
        title: `Día ${dayNumber}`,
        steps: 0,
        summary: '',
        sectionId,
        sectionTitle,
        notes: [],
        events: [],
        images: []
      };
      continue;
    }

    if (trimmed.startsWith('@note')) {
      finalizeEvent();
      finalizeNote();
      mode = 'NOTE';
      currentNote = { content: '' };
      continue;
    }

    // Check if line is an event header
    const eventMatch = trimmed.match(eventHeaderRegex);
    if (eventMatch) {
      finalizeEvent();
      finalizeNote();
      mode = 'EVENT';

      const [, time, duration, type, initialDesc] = eventMatch;
      const eventId = `evt-${currentDay ? currentDay.id : 'x'}-${currentDay ? currentDay.events.length + 1 : i}`;

      currentEvent = {
        id: eventId,
        time: time.padStart(5, '0'),
        duration,
        type: type.toUpperCase(),
        description: initialDesc.trim() ? initialDesc.trim() + '\n' : ''
      };
      continue;
    }

    // Check if line is "Option" for an event
    if (mode === 'EVENT' || mode === 'OPTION') {
      if (trimmed === 'Option' || trimmed === 'Opción') {
        finalizeOption();
        mode = 'OPTION';
        currentOption = {
          title: '',
          description: ''
        };
        continue;
      }
    }

    // Process content according to mode
    if (mode === 'TRIP') {
      if (trimmed.startsWith('title:')) config.title = trimmed.replace('title:', '').trim();
      else if (trimmed.startsWith('departure:')) config.departure = trimmed.replace('departure:', '').trim();
      else if (trimmed.startsWith('return:')) config.return = trimmed.replace('return:', '').trim();
      else if (trimmed.startsWith('timezone:')) config.timezone = trimmed.replace('timezone:', '').trim();
      else if (trimmed.startsWith('currency:')) config.currency = trimmed.replace('currency:', '').trim();
    } else if (mode === 'SECTION' && currentSection) {
      if (trimmed.startsWith('title:')) currentSection.title = trimmed.replace('title:', '').trim();
      else if (trimmed.startsWith('hotel:')) currentSection.hotel = trimmed.replace('hotel:', '').trim();
      else if (trimmed.startsWith('summary:')) currentSection.summary = trimmed.replace('summary:', '').trim();
      else if (trimmed.startsWith('notes:')) currentSection.notes = trimmed.replace('notes:', '').trim();
    } else if (mode === 'DAY' && currentDay) {
      if (/^option:/i.test(trimmed)) {
        // Etiqueta de opción (A, B…): se normaliza a mayúsculas; vacía = se ignora.
        const key = trimmed.replace(/^option:/i, '').trim().toUpperCase();
        if (key) currentDayOption = key;
      }
      else if (trimmed.startsWith('title:')) {
        currentDay.title = trimmed.replace('title:', '').trim();
        currentDayTitleLine = i + 1;
      }
      else if (trimmed.startsWith('stars:')) currentDay.stars = parseInt(trimmed.replace('stars:', '').trim(), 10) || 0;
      else if (trimmed.startsWith('steps:')) currentDay.steps = parseInt(trimmed.replace('steps:', '').trim(), 10) || 0;
      else if (trimmed.startsWith('summary:')) currentDay.summary = trimmed.replace('summary:', '').trim();
      else if (/^(image\d*|foto|fotos):/i.test(trimmed)) {
        const rawVal = trimmed.replace(/^(image\d*|foto|fotos):/i, '').trim();
        if (rawVal) {
          let src = rawVal;
          let label: string | undefined = undefined;
          const match = rawVal.match(/^(.*?)\s*\[(.*?)\]$/);
          if (match) {
            src = match[1].trim();
            label = match[2].trim();
          }
          const imgPath = normalizeImagePath(src);
          if (!currentDay.images) currentDay.images = [];
          currentDay.images.push({ src: imgPath, label });
        }
      }
    } else if (mode === 'NOTE' && currentNote) {
      currentNote.content += line + '\n';
    } else if (mode === 'OPTION' && currentOption) {
      if (!currentOption.title) {
        currentOption.title = trimmed;
      } else {
        currentOption.description += line + '\n';
      }
    } else if (mode === 'EVENT' && currentEvent) {
      currentEvent.description += line + '\n';
    }
  }

  // Finalize all remaining objects
  finalizeSection();

  // Días con 2+ opciones: guardar las variantes (ordenadas por etiqueta) en el día.
  applyDayVariants(Array.from(fileDayEntries.values()));

  // El itinerario (@itinerary) define el orden canónico de secciones y días;
  // el orden de aparición en el archivo deja de importar.
  if (itinerary) {
    return buildOrderedTripData(config, sections, allDays, itinerary);
  }

  // Sin @itinerary: se conserva el orden de aparición en el archivo.
  // Re-calcular fechas por si departure se parseó después de los días.
  // También se renumera: los bloques extra de opciones (`option:`) no cuentan como días.
  allDays.forEach((day, index) => {
    day.dayNumber = index + 1;
    day.id = `day-${day.dayNumber}`;
    const { dateStr, formatted, weekday } = addDaysToDate(config.departure, day.dayNumber);
    day.dateStr = dateStr;
    day.dateFormatted = formatted;
    day.dayOfWeek = weekday;
  });

  // expectedReturn = departure + N días: como se llega a destino al día siguiente de la
  // salida (Día 1 = departure + 1), el último día (Día N) cae en departure + N, que es la
  // fecha de regreso esperada (día en que se sale de Japón).
  const expectedReturn = addDaysToDate(config.departure, allDays.length).dateStr;

  return {
    config,
    sections,
    allDays,
    expectedReturn
  };
}

// Contenido de un bloque @day tal como quedó parseado, como opción `key`.
function variantOf(day: Day, key: string): DayVariant {
  return {
    key,
    stars: day.stars,
    steps: day.steps,
    summary: day.summary,
    notes: day.notes,
    events: day.events,
    images: day.images || []
  };
}

// Copia el contenido de una opción a los campos del día (el día "refleja" esa opción).
export function applyVariantFields(day: Day, variant: DayVariant) {
  day.stars = variant.stars;
  day.steps = variant.steps;
  day.summary = variant.summary;
  day.notes = variant.notes;
  day.events = variant.events;
  day.images = variant.images;
  day.activeOption = variant.key;
}

// Un día con 2+ bloques `option:` guarda sus variantes ordenadas por etiqueta (A, B…) y
// refleja la primera (la opción por defecto). Con una sola opción definida se comporta
// como un día normal (sin selector).
function applyDayVariants(entries: { day: Day; variants: DayVariant[] }[]) {
  for (const entry of entries) {
    if (entry.variants.length < 2) continue;
    const sorted = [...entry.variants].sort((a, b) => a.key.localeCompare(b.key, 'es', { numeric: true }));
    entry.day.variants = sorted;
    applyVariantFields(entry.day, sorted[0]);
  }
}

// Aplica el orden definido por @itinerary:
// - Las secciones y días siguen el itinerario, no el orden del archivo.
// - Días o secciones definidos en el archivo pero ausentes del itinerario NO se muestran.
// - Entradas del itinerario sin definición en el archivo producen bloques de error
//   (bandera `missing`), que el renderizado pinta como advertencia.
// - El número de día (y su fecha) se asigna por posición en el itinerario:
//   Día N = departure + N días.
function buildOrderedTripData(
  config: TripConfig,
  fileSections: Section[],
  fileDays: Day[],
  itinerary: ItinerarySection[]
): TripData {
  const dayByTitle = new Map<string, Day>();
  for (const day of fileDays) dayByTitle.set(day.title, day);
  const sectionByName = new Map<string, Section>();
  for (const section of fileSections) sectionByName.set(section.name, section);

  const sections: Section[] = [];
  const allDays: Day[] = [];

  for (const itinSection of itinerary) {
    const sectionDef = sectionByName.get(itinSection.name);
    const section: Section = sectionDef
      ? { ...sectionDef, days: [] }
      : {
          id: `section-${itinSection.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          name: itinSection.name,
          title: itinSection.name,
          days: [],
          missing: true
        };
    sections.push(section);

    for (const dayTitle of itinSection.dayTitles) {
      const dayDef = dayByTitle.get(dayTitle);
      const day: Day = dayDef
        ? { ...dayDef, sectionId: section.id, sectionTitle: section.name }
        : {
            id: '',
            dayNumber: 0,
            dateStr: '',
            dateFormatted: '',
            dayOfWeek: '',
            title: dayTitle,
            steps: 0,
            summary: '',
            sectionId: section.id,
            sectionTitle: section.name,
            notes: [],
            events: [],
            images: [],
            missing: true
          };
      section.days.push(day);
      allDays.push(day);
    }
  }

  // Renumerar días por posición de itinerario (asigna también id y fecha).
  allDays.forEach((day, index) => {
    const dayNumber = index + 1;
    day.dayNumber = dayNumber;
    day.id = `day-${dayNumber}`;
    const { dateStr, formatted, weekday } = addDaysToDate(config.departure, dayNumber);
    day.dateStr = dateStr;
    day.dateFormatted = formatted;
    day.dayOfWeek = weekday;
  });

  const expectedReturn = addDaysToDate(config.departure, allDays.length).dateStr;

  return {
    config,
    sections,
    allDays,
    expectedReturn,
    itinerary
  };
}
