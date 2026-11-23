import { monthKey, today, type MonthKey } from '@/shared/domain/dates';

import type { Income, IncomeOccurrenceView } from '../domain/income';
import type { IncomeRepository } from '../domain/income-repository';

/**
 * Read use cases. They do not materialize fixed schedules: that happens on
 * app start and when an income is saved (see SyncIncomes).
 */
export class GetIncomes {
  constructor(private readonly incomes: IncomeRepository) {}

  list(): Promise<Income[]> {
    return this.incomes.listActive();
  }

  /** Every open receipt: dated ones first in date order, waiting ones last. */
  pending(): Promise<IncomeOccurrenceView[]> {
    return this.incomes.listPending();
  }

  /** Expected income of a month: fixed occurrences plus uncertain ones tagged with that month. */
  expectedCents(month: MonthKey = monthKey(today())): Promise<number> {
    return this.incomes.sumExpected(month);
  }
}
