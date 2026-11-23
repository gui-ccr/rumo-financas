import type { AccountRepository, CategoryRepository } from '@/features/accounts/domain/repositories';

import type { Bill, BillOccurrenceView } from '../domain/bill';
import type { BillRepository } from '../domain/bill-repository';

export type BillDetail = {
  bill: Bill;
  accountName: string | null;
  categoryName: string | null;
  /** Open occurrences, the next due first. The first one is what "Pagar" pays. */
  open: BillOccurrenceView[];
  /** Paid occurrences, most recent first. */
  paid: BillOccurrenceView[];
};

/** Everything the bill screen shows: the definition, its next dues and its payment history. */
export class GetBillDetail {
  constructor(
    private readonly bills: BillRepository,
    private readonly accounts: AccountRepository,
    private readonly categories: CategoryRepository,
  ) {}

  async execute(billId: number): Promise<BillDetail | null> {
    const bill = await this.bills.findById(billId);
    if (!bill) return null;

    const [occurrences, accounts, categories] = await Promise.all([
      this.bills.occurrencesOfBill(billId),
      this.accounts.list(),
      this.categories.list(),
    ]);

    return {
      bill,
      accountName: accounts.find((a) => a.id === bill.accountId)?.name ?? null,
      categoryName: categories.find((c) => c.id === bill.categoryId)?.name ?? null,
      open: occurrences.filter((o) => o.status === 'pending'),
      paid: occurrences.filter((o) => o.status === 'paid').reverse(),
    };
  }
}
