import { Day } from './types';
import { applyVariantFields } from './parser';

// Opción elegida por día (para días con `option: A` / `option: B`…).
// Se guarda por TÍTULO del día (estable si se reordena el itinerario) en localStorage.
const STORAGE_KEY = 'dayOptions';

let selection: Record<string, string> = loadSelection();

function loadSelection(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {}; // sin localStorage (modo privado, tests): se usa solo la memoria
  }
}

function saveSelection() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
  } catch {
    /* ignorar */
  }
}

export function hasVariants(day: Day): boolean {
  return !!day.variants && day.variants.length > 1;
}

// Etiqueta de la opción elegida para el día; si la guardada ya no existe, la primera (por defecto).
export function getSelectedOption(day: Day): string | undefined {
  if (!day.variants || day.variants.length === 0) return undefined;
  const saved = selection[day.title];
  if (saved && day.variants.some(v => v.key === saved)) return saved;
  return day.variants[0].key;
}

export function setSelectedOption(day: Day, key: string) {
  if (!day.variants || !day.variants.some(v => v.key === key)) return;
  selection[day.title] = key;
  saveSelection();
}

// Copia del día con el contenido de la opción `key` (por defecto, la elegida): estrellas, pasos,
// resumen, notas, fotos y cronograma. Los días sin opciones se devuelven tal cual.
export function resolveDay(day: Day, key?: string): Day {
  if (!hasVariants(day)) return day;
  const wanted = key ?? getSelectedOption(day);
  const variant = day.variants!.find(v => v.key === wanted) ?? day.variants![0];
  const view: Day = { ...day };
  applyVariantFields(view, variant);
  return view;
}
