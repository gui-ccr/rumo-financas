import type { MonthKey } from '@/shared/domain/dates';

import type { CategorySpend, DailyFlow, MonthTotals } from './month-overview';

export interface OverviewRepository {
  monthTotals(month: MonthKey): Promise<MonthTotals>;
  spendByCategory(month: MonthKey): Promise<CategorySpend[]>;
  dailyFlow(month: MonthKey): Promise<DailyFlow[]>;
}
