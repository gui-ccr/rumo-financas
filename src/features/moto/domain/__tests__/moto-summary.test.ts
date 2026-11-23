import { periodRange, summarize, type MotoEntry } from '../moto-summary';

const entry = (date: string, kind: 'income' | 'expense', categoryId: number, totalCents: number): MotoEntry => ({
  date,
  kind,
  categoryId,
  name: `cat${categoryId}`,
  icon: 'bike',
  color: '#000000',
  totalCents,
});

describe('moto summary', () => {
  it('computes profit, worked days and per-app totals', () => {
    const s = summarize(
      [
        entry('2026-11-09', 'income', 1, 15000),
        entry('2026-11-09', 'income', 2, 5000),
        entry('2026-11-09', 'expense', 3, 4000),
        entry('2026-11-11', 'income', 1, 10000),
        entry('2026-11-12', 'expense', 3, 3000),
      ],
      '2026-11-09',
      '2026-11-15',
    );
    expect(s.earnedCents).toBe(30000);
    expect(s.costCents).toBe(7000);
    expect(s.profitCents).toBe(23000);
    expect(s.workedDays).toBe(2);
    expect(s.profitPerDayCents).toBe(11500);
    expect(s.byApp.map((a) => [a.categoryId, a.totalCents])).toEqual([
      [1, 25000],
      [2, 5000],
    ]);
    expect(s.days).toHaveLength(7);
    expect(s.days[3]).toEqual({ date: '2026-11-12', earnedCents: 0, profitCents: -3000 });
  });

  it('weeks start on Monday', () => {
    expect(periodRange('week', '2026-11-14')).toEqual({ start: '2026-11-09', end: '2026-11-15' });
  });
});
