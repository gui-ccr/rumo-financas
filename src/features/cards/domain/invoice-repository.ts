import type { MonthKey } from '@/shared/domain/dates';
import type { TransactionView } from '@/features/transactions/domain/transaction';

import type { InvoiceTotals } from './invoice';

export interface InvoiceRepository {
  totalsByMonth(cardId: number): Promise<InvoiceTotals[]>;
  transactions(cardId: number, month: MonthKey): Promise<TransactionView[]>;
}
