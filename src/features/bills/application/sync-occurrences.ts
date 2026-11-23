import { today, type ISODate } from '@/shared/domain/dates';

import type { Bill } from '../domain/bill';
import type { BillRepository } from '../domain/bill-repository';
import { expectedDueDates, missingDates } from '../domain/recurrence';

/** Materializes the due dates every active bill should have by now. Idempotent. */
export class SyncOccurrences {
  constructor(private readonly bills: BillRepository) {}

  /** Returns how many occurrences were created, so callers can refresh only when something changed. */
  async execute(ref: ISODate = today()): Promise<number> {
    let created = 0;
    for (const bill of await this.bills.listActive()) {
      created += await this.syncBill(bill, ref);
    }
    return created;
  }

  async syncBill(bill: Bill, ref: ISODate = today()): Promise<number> {
    const existing = await this.bills.occurrenceDates(bill.id);
    const missing = missingDates(expectedDueDates(bill, ref), existing);
    for (const due of missing) {
      await this.bills.addOccurrence(bill.id, due, bill.amountCents);
    }
    return missing.length;
  }
}
