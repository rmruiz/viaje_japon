import { TripConfig, Section, Day, TripEvent, EventOption, DayNote, TripData } from './types';

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAY_NAMES_ES = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

function addDaysToDate(baseDateStr: string, daysToAdd: number): { dateStr: string; formatted: string; weekday: string } {
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

  const weekday = WEEKDAY_NAMES_ES[d.getUTCDay()];
  const monthName = MONTH_NAMES_ES[d.getUTCMonth()];
  const formatted = `${weekday} ${d.getUTCDate()} de ${monthName.toLowerCase()} de ${yyyy}`;

  return { dateStr, formatted, weekday };
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

  let mode: 'NONE' | 'TRIP' | 'SECTION' | 'DAY' | 'NOTE' | 'EVENT' | 'OPTION' = 'NONE';

  let totalDayCounter = 0;

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
      allDays.push(currentDay);
      if (currentSection) {
        currentSection.days.push(currentDay);
      }
      currentDay = null;
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

    // Check tags
    if (trimmed.startsWith('@trip')) {
      finalizeSection();
      mode = 'TRIP';
      continue;
    }

    if (trimmed.startsWith('@section')) {
      finalizeSection();
      mode = 'SECTION';
      const sectionName = trimmed.replace(/^@section\s*/, '').trim() || 'Sección';
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
      
      const dayNumber = totalDayCounter;
      const { dateStr, formatted, weekday } = addDaysToDate(config.departure, dayNumber - 1);
      
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
      if (trimmed.startsWith('title:')) currentDay.title = trimmed.replace('title:', '').trim();
      else if (trimmed.startsWith('stars:')) currentDay.stars = parseInt(trimmed.replace('stars:', '').trim(), 10) || 0;
      else if (trimmed.startsWith('steps:')) currentDay.steps = parseInt(trimmed.replace('steps:', '').trim(), 10) || 0;
      else if (trimmed.startsWith('summary:')) currentDay.summary = trimmed.replace('summary:', '').trim();
      else if (/^(image\d*|foto|fotos):/i.test(trimmed)) {
        const rawVal = trimmed.replace(/^(image\d*|foto|fotos):/i, '').trim();
        if (rawVal) {
          const imgPath = normalizeImagePath(rawVal);
          if (!currentDay.images) currentDay.images = [];
          currentDay.images.push(imgPath);
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

  // Re-calculate dates in case departure was parsed after days
  allDays.forEach(day => {
    const { dateStr, formatted, weekday } = addDaysToDate(config.departure, day.dayNumber - 1);
    day.dateStr = dateStr;
    day.dateFormatted = formatted;
    day.dayOfWeek = weekday;
  });

  return {
    config,
    sections,
    allDays
  };
}
