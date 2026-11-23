import { z } from 'zod';

import { isCreditCard } from '@/features/accounts/domain/account';
import type { AccountRepository } from '@/features/accounts/domain/repositories';
import type { TransactionRepository } from '@/features/transactions/domain/transaction-repository';
import { parseInput } from '@/shared/application/parse-input';
import { DomainError, NotFoundError } from '@/shared/domain/errors';

export const PayInvoiceInputSchema = z.object({
  cardId: z.number().int(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  fromAccountId: z.number().int({ message: 'Escolha a conta que paga a fatura' }),
  amountCents: z.number().int().positive('Informe um valor maior que zero'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type PayInvoiceInput = z.input<typeof PayInvoiceInputSchema>;

/**
 * Paying an invoice moves money from a bank account to the card.
 * It is a transfer, not a new expense — the purchases were already counted.
 */
export class PayInvoice {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly transactions: TransactionRepository,
  ) {}

  async execute(input: PayInvoiceInput): Promise<number> {
    const v = parseInput(PayInvoiceInputSchema, input);
    const card = await this.accounts.findById(v.cardId);
    if (!card || !isCreditCard(card)) throw new NotFoundError('Cartão');
    const from = await this.accounts.findById(v.fromAccountId);
    if (!from) throw new NotFoundError('Conta');
    if (from.type === 'credit_card') throw new DomainError('A fatura precisa ser paga por uma conta ou dinheiro');

    return this.transactions.insert({
      type: 'transfer',
      amountCents: v.amountCents,
      date: v.date,
      description: `Fatura ${card.name}`,
      categoryId: null,
      accountId: from.id,
      toAccountId: card.id,
      billOccurrenceId: null,
      invoiceMonth: v.month,
      installment: null,
      source: 'manual',
      rawText: null,
    });
  }
}
