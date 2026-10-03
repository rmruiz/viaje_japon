export interface TripConfig {
  title: string;
  departure: string; // YYYY-MM-DD
  return: string;    // YYYY-MM-DD
  timezone: string;
  currency: string;
}

export interface EventOption {
  title: string;
  description: string;
}

export interface TripEvent {
  id: string;
  time: string;         // e.g. "08:50"
  duration: string;     // e.g. "10m"
  type: string;         // WALK, TRAIN, BUS, TAXI, VISIT, FOOD, SHOP, HOTEL, PHOTO, BREAK, FREE, NOTE, etc.
  description: string;
  mapUrl?: string;
  options?: EventOption[];
  links?: { text: string; url: string }[];
}

export interface DayNote {
  content: string;
}

export interface DayImage {
  src: string;
  label?: string;
}

export interface Day {
  id: string;           // e.g. "day-1"
  dayNumber: number;    // e.g. 1
  dateStr: string;      // e.g. "2026-02-15"
  dateFormatted: string;// e.g. "Domingo 15 de febrero de 2026"
  dayOfWeek: string;    // e.g. "Domingo"
  title: string;
  steps: number;
  summary: string;
  sectionId: string;
  sectionTitle: string;
  stars?: number;
  notes: DayNote[];
  events: TripEvent[];
  images?: DayImage[];
  fotos?: string[];
}

export interface Section {
  id: string;           // e.g. "section-tokio"
  name: string;         // e.g. "Tokio"
  title: string;        // e.g. "BASE 1 — TOKIO (Hatagaya)"
  hotel?: string;
  summary?: string;
  notes?: string;
  days: Day[];
}

export interface TripData {
  config: TripConfig;
  sections: Section[];
  allDays: Day[];
  expectedReturn: string; // YYYY-MM-DD = departure + N días (se llega a destino al día siguiente de la salida)
}
