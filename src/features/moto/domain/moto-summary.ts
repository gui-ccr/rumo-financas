import { addDays, monthRange, startOfWeek, today, type ISODate, type MonthKey } from '@/shared/domain/dates';

/** One day's totals for a single moto category (an app or a cost). */
export type MotoEntry = {
  date: ISODate;
  kind: 'income' | 'expense';
  categoryId: number;
  name: string;
  icon: string;
  color: string;
  totalCents: number;
};

export type MotoPeriod = 'day' | 'week' | 'month';

export const MOTO_PERIOD_LABEL: Record<MotoPeriod, string> = {
  day: 'Hoje',
  week: 'Semana',
  month: 'Mês',
};

export function periodRange(period: MotoPeriod, ref: ISODate = today()): { start: ISODate; end: ISODate } {
  if (period === 'day') return { start: ref, end: ref };
  if (period === 'week') {
    const start = startOfWeek(ref);
    return { start, end: addDays(start, 6) };
  }
  return monthRange(ref.slice(0, 7) as MonthKey);
}

export type CategoryTotal = Omit<MotoEntry, 'date'>;

export type MotoSummary = {
  earnedCents: number;
  costCents: number;
  profitCents: number;
  /** Days with at least one income entry. */
  workedDays: number;
  /** Profit per worked day, 0 when nothing was worked. */
  profitPerDayCents: number;
  byApp: CategoryTotal[];
  byCost: CategoryTotal[];
  /** Profit per calendar day of the range, in order, for the bar chart. */
  days: { date: ISODate; profitCents: number; earnedCents: number }[];
};

function totalsByCategory(entries: MotoEntry[]): CategoryTotal[] {
  const map = new Map<number, CategoryTotal>();
  for (const { date: _date, ...e } of entries) {
    const current = map.get(e.categoryId);
    if (current) current.totalCents += e.totalCents;
    else map.set(e.categoryId, { ...e });
  }
  return [...map.values()].sort((a, b) => b.totalCents - a.totalCents);
}

export function summarize(entries: MotoEntry[], start: ISODate, end: ISODate): MotoSummary {
  const incomes = entries.filter((e) => e.kind === 'income');
  const costs = entries.filter((e) => e.kind === 'expense');
  const earnedCents = incomes.reduce((s, e) => s + e.totalCents, 0);
  const costCents = costs.reduce((s, e) => s + e.totalCents, 0);
  const workedDays = new Set(incomes.map((e) => e.date)).size;
  const profitCents = earnedCents - costCents;

  const days: MotoSummary['days'] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    const ofDay = entries.filter((e) => e.date === d);
    const earned = ofDay.filter((e) => e.kind === 'income').reduce((s, e) => s + e.totalCents, 0);
    const cost = ofDay.filter((e) => e.kind === 'expense').reduce((s, e) => s + e.totalCents, 0);
    days.push({ date: d, earnedCents: earned, profitCents: earned - cost });
  }

  return {
    earnedCents,
    costCents,
    profitCents,
    workedDays,
    profitPerDayCents: workedDays ? Math.round(profitCents / workedDays) : 0,
    byApp: totalsByCategory(incomes),
    byCost: totalsByCategory(costs),
    days,
  };
}
