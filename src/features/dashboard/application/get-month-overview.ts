import type { AccountRepository } from '@/features/accounts/domain/repositories';
import { today, type MonthKey } from '@/shared/domain/dates';

import type { MonthOverview } from '../domain/month-overview';
import type { OverviewRepository } from '../domain/overview-repository';

export class GetMonthOverview {
  constructor(
    private readonly overview: OverviewRepository,
    private readonly accounts: AccountRepository,
  ) {}

  async execute(month: MonthKey): Promise<MonthOverview> {
    const [totals, byCategory, daily, balances] = await Promise.all([
      this.overview.monthTotals(month),
      this.overview.spendByCategory(month),
      this.overview.dailyFlow(month),
      this.accounts.balances(today()),
    ]);
    return { totals, byCategory, daily, balances };
  }
}
