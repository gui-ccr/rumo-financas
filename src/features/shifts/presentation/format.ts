import { formatShortDate, toISODate } from '@/shared/domain/dates';

const pad = (n: number) => String(n).padStart(2, '0');

/** 134 -> "2h14"; 45 -> "45 min". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${pad(m)}` : `${m} min`;
}

/** UTC ISO datetime -> local "19:05". */
export function formatClock(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** UTC ISO datetime -> local "23 nov · 19:05". */
export function formatShiftStart(iso: string): string {
  return `${formatShortDate(toISODate(new Date(iso)))} · ${formatClock(iso)}`;
}

export function pluralPix(count: number): string {
  return count === 1 ? '1 Pix' : `${count} Pix`;
}
