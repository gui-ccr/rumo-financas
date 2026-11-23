import { isCreditCard, type CreditCard } from '@/features/accounts/domain/account';
import type { AccountRepository } from '@/features/accounts/domain/repositories';
import { today, type ISODate } from '@/shared/domain/dates';

import { buildInvoices, isPayable, type Invoice } from '../domain/invoice';
import type { InvoiceRepository } from '../domain/invoice-repository';

export type CardWithInvoices = { card: CreditCard; invoices: Invoice[] };

export class GetInvoices {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly invoices: InvoiceRepository,
  ) {}

  async forAllCards(ref: ISODate = today()): Promise<CardWithInvoices[]> {
    const cards = (await this.accounts.list()).filter(isCreditCard);
    return Promise.all(
      cards.map(async (card) => ({
        card,
        invoices: buildInvoices(card, await this.invoices.totalsByMonth(card.id), ref),
      })),
    );
  }

  /** Closed and unpaid invoices across all cards; they behave like bills. */
  async payable(ref: ISODate = today()): Promise<Invoice[]> {
    const all = await this.forAllCards(ref);
    return all.flatMap((c) => c.invoices).filter(isPayable);
  }
}
