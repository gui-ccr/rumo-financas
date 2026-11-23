import { expectedDueDates, missingDates } from '@/features/bills/domain/recurrence';
import { monthKey, today, type ISODate } from '@/shared/domain/dates';

import type { Income } from '../domain/income';
import type { IncomeRepository } from '../domain/income-repository';

/** Materializes the dates every active fixed income should have by now. Idempotent. Uncertain incomes are never generated. */
export class SyncIncomes {
  constructor(private readonly incomes: IncomeRepository) {}

  /** Returns how many occurrences were created, so callers can refresh only when something changed. */
  async execute(ref: ISODate = today()): Promise<number> {
    let created = 0;
    for (const income of await this.incomes.listActive()) {
      created += await this.syncIncome(income, ref);
    }
    return created;
  }

  async syncIncome(income: Income, ref: ISODate = today()): Promise<number> {
    if (income.kind !== 'fixed' || !income.recurrence || income.dueDay === null || !income.startMonth) return 0;
    const schedule = { recurrence: income.recurrence, dueDay: income.dueDay, startMonth: income.startMonth };
    const existing = await this.incomes.occurrenceDates(income.id);
    const missing = missingDates(expectedDueDates(schedule, ref), existing);
    for (const due of missing) {
      await this.incomes.addScheduled(income.id, due, monthKey(due), income.expectedCents);
    }
    return missing.length;
  }
}
