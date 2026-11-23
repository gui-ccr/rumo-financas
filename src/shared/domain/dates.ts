/**
 * Dates are stored as local calendar strings: "YYYY-MM-DD" for days and
 * "YYYY-MM" for months. No timezones involved, so a purchase at 23:50 never
 * slides into the next day.
 */

export type ISODate = string; // YYYY-MM-DD
export type MonthKey = string; // YYYY-MM

const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function today(): ISODate {
  return toISODate(new Date());
}

export function parseISODate(s: ISODate): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function monthKey(s: ISODate | Date): MonthKey {
  const iso = typeof s === 'string' ? s : toISODate(s);
  return iso.slice(0, 7);
}

export function currentMonth(): MonthKey {
  return monthKey(new Date());
}

export function daysInMonth(year: number, month1: number): number {
  return new Date(year, month1, 0).getDate();
}

/** Add months to a month key: addMonths("2026-11", 3) -> "2027-02". */
export function addMonths(key: MonthKey, n: number): MonthKey {
  const [y, m] = key.split('-').map(Number);
  const total = y * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}`;
}

/** Build a date in a month, clamping the day (31 in February -> 28/29). */
export function dateInMonth(key: MonthKey, day: number): ISODate {
  const [y, m] = key.split('-').map(Number);
  const clamped = Math.min(Math.max(day, 1), daysInMonth(y, m));
  return `${key}-${pad(clamped)}`;
}

export function addDays(s: ISODate, n: number): ISODate {
  const d = parseISODate(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function diffDays(a: ISODate, b: ISODate): number {
  const ms = parseISODate(a).getTime() - parseISODate(b).getTime();
  return Math.round(ms / 86_400_000);
}

export function monthRange(key: MonthKey): { start: ISODate; end: ISODate } {
  const [y, m] = key.split('-').map(Number);
  return { start: `${key}-01`, end: `${key}-${pad(daysInMonth(y, m))}` };
}

/** Monday-based week start. */
export function startOfWeek(s: ISODate): ISODate {
  const d = parseISODate(s);
  const weekday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - weekday);
  return toISODate(d);
}

const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "2026-11" -> "Novembro" (adds the year when it is not the current one). */
export function formatMonth(key: MonthKey): string {
  const [y, m] = key.split('-').map(Number);
  const name = capitalize(MONTHS[m - 1]);
  return y === new Date().getFullYear() ? name : `${name} de ${y}`;
}

/** "2026-11-14" -> "14 nov". */
export function formatShortDate(s: ISODate): string {
  const [, m, d] = s.split('-').map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]}`;
}

/** Day header for lists: "Hoje", "Ontem" or "Sexta, 14 nov". */
export function formatDayHeader(s: ISODate, ref: ISODate = today()): string {
  const delta = diffDays(ref, s);
  if (delta === 0) return 'Hoje';
  if (delta === 1) return 'Ontem';
  return `${capitalize(WEEKDAYS[parseISODate(s).getDay()])}, ${formatShortDate(s)}`;
}

/** Relative due label: "vence hoje", "vence amanhã", "em 5 dias", "atrasada há 2 dias". */
export function formatDue(due: ISODate, ref: ISODate = today()): string {
  const delta = diffDays(due, ref);
  if (delta === 0) return 'Vence hoje';
  if (delta === 1) return 'Vence amanhã';
  if (delta > 1) return `Vence em ${delta} dias`;
  if (delta === -1) return 'Atrasada desde ontem';
  return `Atrasada há ${-delta} dias`;
}
