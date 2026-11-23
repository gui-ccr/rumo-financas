import type { BillPriority } from '@/features/bills/domain/bill';
import { addDays, toISODate, type ISODate } from '@/shared/domain/dates';

export type AgendaKind = 'event' | 'bill' | 'income' | 'note';

/** One line of the agenda. `time` is local "HH:mm"; all-day items have none. */
export type AgendaItem = {
  kind: AgendaKind;
  id: string;
  title: string;
  time?: string;
  allDay: boolean;
  /** Calendar color for device events. */
  color?: string;
  amountCents?: number;
  /** Bills only: how much the bill matters when money is short. */
  priority?: BillPriority;
  /** Where tapping the item goes. Device events are read-only, so they have none. */
  href: string | null;
};

/** Inclusive range of local days. */
export type AgendaRange = { start: ISODate; end: ISODate };

/** A device calendar event, already converted to dates. */
export type DeviceEventSource = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  color?: string;
};

export type BillSource = {
  /** The occurrence (this due date). */
  id: number;
  /** The bill the occurrence belongs to: its tap goes to the bill's detail. */
  billId: number;
  name: string;
  dueDate: ISODate;
  amountCents: number | null;
  paid: boolean;
  priority?: BillPriority;
};

export type IncomeSource = {
  id: number;
  name: string;
  expectedDate: ISODate | null;
  expectedCents: number;
  received: boolean;
};

export type NoteSource = {
  id: number;
  title: string;
  /** UTC ISO datetime, or null when the note has no reminder. */
  remindAt: string | null;
  done: boolean;
};

export type AgendaSources = {
  events: DeviceEventSource[];
  bills: BillSource[];
  incomes: IncomeSource[];
  notes: NoteSource[];
};

/** Every local day in the range, first to last. Empty when the range is inverted. */
export function daysInRange(range: AgendaRange): ISODate[] {
  const days: ISODate[] = [];
  for (let day = range.start; day <= range.end; day = addDays(day, 1)) {
    days.push(day);
    if (days.length > 400) break; // guard against a malformed range
  }
  return days;
}

export function timeOf(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Last local day an event touches. An end at exactly local midnight belongs to the
 * day before (the calendar convention for all-day events), so it does not spill over.
 */
export function lastDayOf(start: Date, end: Date): ISODate {
  const startDay = toISODate(start);
  if (end.getTime() <= start.getTime()) return startDay;
  const endDay = toISODate(end);
  const atMidnight = end.getHours() === 0 && end.getMinutes() === 0 && end.getSeconds() === 0 && end.getMilliseconds() === 0;
  return atMidnight && endDay > startDay ? addDays(endDay, -1) : endDay;
}

/** Sorts a day: all-day first, then by time, then by title. */
export function compareItems(a: AgendaItem, b: AgendaItem): number {
  if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
  const ta = a.time ?? '';
  const tb = b.time ?? '';
  if (ta !== tb) return ta < tb ? -1 : 1;
  return a.title.localeCompare(b.title, 'pt-BR');
}

function expandEvent(event: DeviceEventSource, days: Set<ISODate>, out: Map<ISODate, AgendaItem[]>) {
  const startDay = toISODate(event.start);
  const lastDay = lastDayOf(event.start, event.end);
  const title = event.title || '(sem título)';
  for (let day = startDay; day <= lastDay; day = addDays(day, 1)) {
    if (!days.has(day)) continue;
    const startsToday = day === startDay;
    // An event that runs over several days shows its start time once, then as an all-day line.
    const timed = !event.allDay && startsToday;
    out.get(day)!.push({
      kind: 'event',
      id: event.id,
      title,
      time: timed ? timeOf(event.start) : undefined,
      allDay: !timed,
      color: event.color,
      href: null,
    });
  }
}

/**
 * Joins everything the agenda shows into one list per local day. Every day of the range
 * is a key, empty days included. Pure: the caller decides where the sources come from.
 */
export function buildAgendaDays(range: AgendaRange, sources: AgendaSources): Map<ISODate, AgendaItem[]> {
  const days = daysInRange(range);
  const inRange = new Set(days);
  const out = new Map<ISODate, AgendaItem[]>(days.map((d) => [d, []]));

  for (const event of sources.events) expandEvent(event, inRange, out);

  for (const bill of sources.bills) {
    if (bill.paid || !inRange.has(bill.dueDate)) continue;
    out.get(bill.dueDate)!.push({
      kind: 'bill',
      id: String(bill.id),
      title: bill.name,
      allDay: true,
      amountCents: bill.amountCents ?? undefined,
      priority: bill.priority,
      href: `/conta/detalhe/${bill.billId}`,
    });
  }

  for (const income of sources.incomes) {
    if (income.received || income.expectedDate === null || !inRange.has(income.expectedDate)) continue;
    out.get(income.expectedDate)!.push({
      kind: 'income',
      id: String(income.id),
      title: income.name,
      allDay: true,
      amountCents: income.expectedCents,
      href: '/dinheiro?tab=planejar',
    });
  }

  for (const note of sources.notes) {
    if (note.done || note.remindAt === null) continue;
    const when = new Date(note.remindAt);
    if (Number.isNaN(when.getTime())) continue;
    const day = toISODate(when);
    if (!inRange.has(day)) continue;
    out.get(day)!.push({
      kind: 'note',
      id: String(note.id),
      title: note.title || 'Lembrete',
      time: timeOf(when),
      allDay: false,
      href: `/nota/${note.id}`,
    });
  }

  for (const items of out.values()) items.sort(compareItems);
  return out;
}
