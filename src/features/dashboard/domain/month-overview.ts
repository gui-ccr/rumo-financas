import type { AccountBalance } from '@/features/accounts/domain/account';
import type { CategoryGroup } from '@/features/accounts/domain/category';
import type { ISODate } from '@/shared/domain/dates';

export type MonthTotals = { incomeCents: number; expenseCents: number };

export type CategorySpend = {
  categoryId: number;
  name: string;
  icon: string;
  color: string;
  group: CategoryGroup;
  totalCents: number;
};

export type DailyFlow = { date: ISODate; incomeCents: number; expenseCents: number };

export type MonthOverview = {
  totals: MonthTotals;
  byCategory: CategorySpend[];
  balances: AccountBalance[];
  daily: DailyFlow[];
};

export function netOf(t: MonthTotals): number {
  return t.incomeCents - t.expenseCents;
}

export type SpendSlice = CategorySpend & { share: number };

/**
 * Slices for the "where the money went" ribbon: the biggest categories,
 * with the long tail folded into one "Outros" slice so the ribbon stays legible.
 */
export function spendSlices(byCategory: CategorySpend[], maxSlices = 5): SpendSlice[] {
  const total = byCategory.reduce((s, c) => s + c.totalCents, 0);
  if (total === 0) return [];
  const sorted = [...byCategory].sort((a, b) => b.totalCents - a.totalCents);
  const head = sorted.slice(0, maxSlices);
  const tail = sorted.slice(maxSlices);
  const slices: SpendSlice[] = head.map((c) => ({ ...c, share: c.totalCents / total }));
  if (tail.length) {
    const tailTotal = tail.reduce((s, c) => s + c.totalCents, 0);
    slices.push({
      categoryId: -1,
      name: `Outras ${tail.length}`,
      icon: 'more',
      color: '#C7D2FE',
      group: 'pessoal',
      totalCents: tailTotal,
      share: tailTotal / total,
    });
  }
  return slices;
}
