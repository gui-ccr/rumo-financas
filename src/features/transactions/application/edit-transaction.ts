import { isCreditCard, type Account } from '@/features/accounts/domain/account';
import type { AccountRepository } from '@/features/accounts/domain/repositories';
import { invoiceMonthFor } from '@/features/cards/domain/invoice';
import { parseInput } from '@/shared/application/parse-input';
import type { ISODate, MonthKey } from '@/shared/domain/dates';
import { NotFoundError } from '@/shared/domain/errors';

import type { Transaction } from '../domain/transaction';
import type { TransactionRepository } from '../domain/transaction-repository';
import { EditTransactionInputSchema, type EditTransactionInput } from './schemas';

export class EditTransaction {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly transactions: TransactionRepository,
  ) {}

  async execute(id: number, input: EditTransactionInput): Promise<void> {
    const v = parseInput(EditTransactionInputSchema, input);
    const current = await this.transactions.findById(id);
    if (!current) throw new NotFoundError('Lançamento');
    const account = await this.accounts.findById(v.accountId);
    if (!account) throw new NotFoundError('Conta');

    await this.transactions.update(id, {
      ...v,
      categoryId: current.type === 'transfer' ? null : v.categoryId,
      invoiceMonth: this.invoiceMonth(current, account, v.date),
    });
  }

  /** Installments keep their invoice; a single card purchase follows its new date. */
  private invoiceMonth(current: Transaction, account: Account, date: ISODate): MonthKey | null {
    if (current.type === 'transfer') return current.invoiceMonth;
    if (current.type !== 'expense' || !isCreditCard(account)) return null;
    if (current.installment && current.accountId === account.id) return current.invoiceMonth;
    return invoiceMonthFor(date, account.closingDay);
  }
}
