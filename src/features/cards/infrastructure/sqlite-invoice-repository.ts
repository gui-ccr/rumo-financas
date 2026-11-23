import type { SQLiteDatabase } from 'expo-sqlite';

import {
  SELECT_TRANSACTION_VIEW,
  toTransactionView,
  type TransactionViewRow,
} from '@/features/transactions/infrastructure/sqlite-transaction-repository';
import type { MonthKey } from '@/shared/domain/dates';

import type { InvoiceTotals } from '../domain/invoice';
import type { InvoiceRepository } from '../domain/invoice-repository';

export class SqliteInvoiceRepository implements InvoiceRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async totalsByMonth(cardId: number): Promise<InvoiceTotals[]> {
    const rows = await this.db.getAllAsync<{ month: string; total: number; paid: number }>(
      `SELECT invoice_month AS month,
         COALESCE(SUM(CASE WHEN type = 'expense' AND account_id = ? THEN amount_cents END), 0) AS total,
         COALESCE(SUM(CASE WHEN type = 'transfer' AND to_account_id = ? THEN amount_cents END), 0) AS paid
       FROM transactions
       WHERE invoice_month IS NOT NULL AND (account_id = ? OR to_account_id = ?)
       GROUP BY invoice_month`,
      [cardId, cardId, cardId, cardId],
    );
    return rows.map((r) => ({ month: r.month, totalCents: r.total, paidCents: r.paid }));
  }

  async transactions(cardId: number, month: MonthKey) {
    const rows = await this.db.getAllAsync<TransactionViewRow>(
      `${SELECT_TRANSACTION_VIEW}
       WHERE t.invoice_month = ? AND (t.account_id = ? OR t.to_account_id = ?)
       ORDER BY t.date DESC, t.id DESC`,
      [month, cardId, cardId],
    );
    return rows.map(toTransactionView);
  }
}
