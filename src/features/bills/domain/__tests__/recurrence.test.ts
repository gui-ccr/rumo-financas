import { addMonths, dateInMonth, formatDue } from '@/shared/domain/dates';

import { missingDates, monthlyDueDates } from '../recurrence';

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
