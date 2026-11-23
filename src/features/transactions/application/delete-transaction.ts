import type { UnitOfWork } from '@/shared/application/unit-of-work';

import type { TransactionRepository } from '../domain/transaction-repository';

/**
 * Port: something else (bills) may point at a transaction as its payment.
 * Declared here so this feature does not depend on the bills feature.
 */
export interface PaymentLinks {
  releaseByTransactions(transactionIds: number[]): Promise<void>;
}

export class DeleteTransaction {
  constructor(
    private readonly transactions: TransactionRepository,
    private readonly paymentLinks: PaymentLinks,
    private readonly uow: UnitOfWork,
  ) {}

  /** Deletes one row, or every installment of its purchase. Linked bills go back to pending. */
  async execute(id: number, wholePurchase = false): Promise<void> {
    const tx = await this.transactions.findById(id);
    if (!tx) return;
    const ids =
      wholePurchase && tx.installment ? await this.transactions.idsInInstallmentGroup(tx.installment.groupId) : [id];

    await this.uow.transaction(async () => {
      await this.paymentLinks.releaseByTransactions(ids);
      await this.transactions.delete(ids);
    });
  }
}
