import { addMonths, dateInMonth, formatDue } from '@/shared/domain/dates';

import { expectedDueDates, missingDates, monthlyDueDates, repeatEndMonth } from '../recurrence';

describe('dates', () => {
  it('adds months across years', () => {
    expect(addMonths('2026-11', 3)).toBe('2027-02');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
  });

  it('clamps day to month length', () => {
    expect(dateInMonth('2026-02', 31)).toBe('2026-02-28');
    expect(dateInMonth('2028-02', 31)).toBe('2028-02-29');
    expect(dateInMonth('2026-04', 31)).toBe('2026-04-30');
  });

  it('describes due dates', () => {
    expect(formatDue('2026-11-14', '2026-11-14')).toBe('Vence hoje');
    expect(formatDue('2026-11-19', '2026-11-14')).toBe('Vence em 5 dias');
    expect(formatDue('2026-11-12', '2026-11-14')).toBe('Atrasada há 2 dias');
  });
});

describe('monthly bills', () => {
  it('generates from the start month up to two months ahead', () => {
    expect(monthlyDueDates(31, '2026-10', '2026-11-14')).toEqual([
      '2026-10-31',
      '2026-11-30',
      '2026-12-31',
      '2027-01-31',
    ]);
  });

  it('only returns what is missing', () => {
    expect(missingDates(['2026-11-10', '2026-12-10'], ['2026-11-10'])).toEqual(['2026-12-10']);
  });
});

describe('bills with a number of times', () => {
  const base = { recurrence: 'monthly' as const, dueDay: 10, startMonth: '2026-11' };

  it('"3 vezes" generates exactly three due dates, from the start month', () => {
    const dates = expectedDueDates({ ...base, repeatCount: 3 }, '2026-11-14');
    expect(dates).toEqual(['2026-11-10', '2026-12-10', '2027-01-10']);
  });

  it('"3 vezes" still generates exactly three when the reference date is later than its end', () => {
    const dates = expectedDueDates({ ...base, repeatCount: 3 }, '2027-06-01');
    expect(dates).toEqual(['2026-11-10', '2026-12-10', '2027-01-10']);
  });

  it('a bill with no count keeps repeating through the materialized horizon', () => {
    expect(expectedDueDates({ ...base, repeatCount: null }, '2026-11-14')).toHaveLength(3);
    expect(expectedDueDates({ ...base }, '2026-11-14')).toHaveLength(3);
  });

  it('a count longer than the horizon is cut at the horizon, not at the count', () => {
    const dates = expectedDueDates({ ...base, repeatCount: 120 }, '2026-11-14');
    expect(dates).toHaveLength(3);
  });

  it('a count of 2 covers the start month and the next one only', () => {
    expect(monthlyDueDates(5, '2026-11', '2026-11-14', 2, 2)).toEqual(['2026-11-05', '2026-12-05']);
  });

  it('the last month of a counted bill is start + count - 1, and null without a count', () => {
    expect(repeatEndMonth('2026-11', 3)).toBe('2027-01');
    expect(repeatEndMonth('2026-11', 2)).toBe('2026-12');
    expect(repeatEndMonth('2026-11', null)).toBeNull();
  });

  it('a one-time bill ignores the count', () => {
    expect(expectedDueDates({ recurrence: 'once', dueDay: 10, startMonth: '2026-11', repeatCount: 3 }, '2026-11-14')).toEqual([
      '2026-11-10',
    ]);
  });
});
