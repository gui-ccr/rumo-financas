import { addMonths, dateInMonth, monthKey, type ISODate, type MonthKey } from '@/shared/domain/dates';

import type { Bill } from './bill';

/** How far ahead monthly bills are materialized, so upcoming ones are visible and reminded. */
export const MONTHS_AHEAD = 2;

/**
 * Due dates a monthly bill should have, from the month it starts through
 * `monthsAhead` months after the reference date.
 */
export function monthlyDueDates(
  dueDay: number,
  startMonth: MonthKey,
  ref: ISODate,
  monthsAhead = MONTHS_AHEAD,
): ISODate[] {
  const last = addMonths(monthKey(ref), monthsAhead);
  const dates: ISODate[] = [];
  for (let m = startMonth; m <= last; m = addMonths(m, 1)) {
    dates.push(dateInMonth(m, dueDay));
  }
  return dates;
}

/**
 * Given the dates that should exist and those that do, return the missing ones.
 * A bill has at most one item per month: a month that already has an item (paid or open,
 * whatever its due day) is not created again. Editing a bill's due day therefore never
 * adds a second item to a month that was already paid or already open.
 */
export function missingDates(expected: ISODate[], existing: ISODate[]): ISODate[] {
  const have = new Set(existing.map((d) => monthKey(d)));
  return expected.filter((d) => !have.has(monthKey(d)));
}

/** Every due date a bill should have right now. */
export function expectedDueDates(bill: Pick<Bill, 'recurrence' | 'dueDay' | 'startMonth'>, ref: ISODate): ISODate[] {
  return bill.recurrence === 'once'
    ? [dateInMonth(bill.startMonth, bill.dueDay)]
    : monthlyDueDates(bill.dueDay, bill.startMonth, ref);
}
