import type { AccountRepository } from '@/features/accounts/domain/repositories';
import { isCreditCard } from '@/features/accounts/domain/account';
import type { CreateTransaction } from '@/features/transactions/application/create-transaction';
import { parseInput } from '@/shared/application/parse-input';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import { DomainError, NotFoundError } from '@/shared/domain/errors';

import type { IncomeRepository } from '../domain/income-repository';
import { ReceiveIncomeInputSchema, type ReceiveIncomeInput } from './schemas';

/**
 * Records the money that came in: creates an income transaction (through the
 * regular transactions use case) and marks the occurrence as received, atomically.
 * Returns the transaction id.
 */
export class ReceiveIncome {
  constructor(
    private readonly incomes: IncomeRepository,
    private readonly accounts: AccountRepository,
    private readonly createTransaction: CreateTransaction,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(occurrenceId: number, input: ReceiveIncomeInput): Promise<number> {
    const v = parseInput(ReceiveIncomeInputSchema, input);
    const occ = await this.incomes.findOccurrence(occurrenceId);
    if (!occ) throw new NotFoundError('Entrada');
    if (occ.status === 'received') throw new DomainError('Essa entrada já foi recebida');

    const account = await this.accounts.findById(v.accountId);
    if (!account) throw new NotFoundError('Conta');
    if (isCreditCard(account)) throw new DomainError('Uma entrada não pode cair em cartão de crédito');

    return this.uow.transaction(async () => {
      const transactionId = await this.createTransaction.execute({
        type: 'income',
        amountCents: v.amountCents,
        date: v.date,
        description: occ.incomeName,
        categoryId: occ.categoryId,
        accountId: v.accountId,
        billOccurrenceId: null,
      });
      await this.incomes.markReceived(occurrenceId, transactionId);
      return transactionId;
    });
  }
}
