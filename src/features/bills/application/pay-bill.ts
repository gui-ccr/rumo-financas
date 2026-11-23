import type { CreateTransaction } from '@/features/transactions/application/create-transaction';
import type { DeleteTransaction } from '@/features/transactions/application/delete-transaction';
import { parseInput } from '@/shared/application/parse-input';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import { NotFoundError } from '@/shared/domain/errors';

import type { BillRepository } from '../domain/bill-repository';
import { PayBillInputSchema, type PayBillInput } from './schemas';

/** Paying a bill records the expense and links it to the due date, atomically. */
export class PayBill {
  constructor(
    private readonly bills: BillRepository,
    private readonly createTransaction: CreateTransaction,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(occurrenceId: number, input: PayBillInput): Promise<void> {
    const v = parseInput(PayBillInputSchema, input);
    const occ = await this.bills.findOccurrence(occurrenceId);
    if (!occ) throw new NotFoundError('Conta');
    if (occ.status === 'paid') return;

    await this.uow.transaction(async () => {
      const transactionId = await this.createTransaction.execute({
        type: 'expense',
        amountCents: v.amountCents,
        date: v.date,
        description: occ.billName,
        categoryId: v.categoryId ?? occ.categoryId,
        accountId: v.accountId,
        billOccurrenceId: occurrenceId,
      });
      await this.bills.markPaid(occurrenceId, transactionId, v.amountCents);
    });
  }
}

/** Undo a payment: the expense goes away and the bill is pending again. */
export class UnpayBill {
  constructor(
    private readonly bills: BillRepository,
    private readonly deleteTransaction: DeleteTransaction,
  ) {}

  async execute(occurrenceId: number): Promise<void> {
    const occ = await this.bills.findOccurrence(occurrenceId);
    if (occ?.transactionId) await this.deleteTransaction.execute(occ.transactionId);
  }
}
