import { isCreditCard } from '@/features/accounts/domain/account';
import type { AccountRepository } from '@/features/accounts/domain/repositories';
import { planInstallments } from '@/features/cards/domain/invoice';
import { parseInput } from '@/shared/application/parse-input';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import { NotFoundError } from '@/shared/domain/errors';

import type { NewTransaction } from '../domain/transaction';
import type { TransactionRepository } from '../domain/transaction-repository';
import { NewTransactionInputSchema, type NewTransactionInput } from './schemas';

export type IdGenerator = () => string;

/**
 * Records a transaction. Card purchases are assigned to their invoice, and
 * installment purchases expand into one row per installment.
 * Returns the id of the first row.
 */
export class CreateTransaction {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly transactions: TransactionRepository,
    private readonly uow: UnitOfWork,
    private readonly newId: IdGenerator,
  ) {}

  async execute(input: NewTransactionInput): Promise<number> {
    const v = parseInput(NewTransactionInputSchema, input);
    const account = await this.accounts.findById(v.accountId);
    if (!account) throw new NotFoundError('Conta');

    const base: NewTransaction = {
      type: v.type,
      amountCents: v.amountCents,
      date: v.date,
      description: v.description,
      categoryId: v.type === 'transfer' ? null : v.categoryId,
      accountId: v.accountId,
      toAccountId: v.type === 'transfer' ? v.toAccountId : null,
      billOccurrenceId: v.billOccurrenceId,
      invoiceMonth: null,
      installment: null,
      source: v.source,
      rawText: v.rawText,
    };

    if (v.type !== 'expense' || !isCreditCard(account)) {
      return this.transactions.insert(base);
    }

    const plan = planInstallments(v.amountCents, v.installments, v.date, account.closingDay);
    const groupId = plan.length > 1 ? this.newId() : null;

    return this.uow.transaction(async () => {
      let firstId = 0;
      for (const p of plan) {
        const id = await this.transactions.insert({
          ...base,
          amountCents: p.amountCents,
          date: p.date,
          invoiceMonth: p.invoiceMonth,
          installment: groupId ? { groupId, number: p.number, total: p.total } : null,
          billOccurrenceId: p.number === 1 ? base.billOccurrenceId : null,
        });
        if (p.number === 1) firstId = id;
      }
      return firstId;
    });
  }
}
