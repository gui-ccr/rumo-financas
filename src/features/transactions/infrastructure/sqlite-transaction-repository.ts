import type { SQLiteDatabase } from 'expo-sqlite';

import type { AccountType } from '@/features/accounts/domain/account';
import type { CategoryGroup } from '@/features/accounts/domain/category';
import { monthRange } from '@/shared/domain/dates';
import { placeholders } from '@/shared/infrastructure/database/sql';

import type {
  NewTransaction,
  TransactionFilters,
  TransactionSource,
  TransactionType,
  TransactionView,
} from '../domain/transaction';
import type { TransactionChanges, TransactionRepository } from '../domain/transaction-repository';

export type TransactionViewRow = {
  id: number;
  type: TransactionType;
  amount_cents: number;
  date: string;
  description: string;
  category_id: number | null;
  account_id: number;
  to_account_id: number | null;
  bill_occurrence_id: number | null;
  invoice_month: string | null;
  installment_group_id: string | null;
  installment_no: number | null;
  installment_total: number | null;
  source: TransactionSource;
  raw_text: string | null;
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
  category_grp: CategoryGroup | null;
  account_name: string;
  account_type: AccountType;
  to_account_name: string | null;
};

/** Shared with other read-side repositories that list transactions (e.g. invoices). */
export const SELECT_TRANSACTION_VIEW = `
  SELECT t.*,
    c.name AS category_name, c.icon AS category_icon, c.color AS category_color, c.grp AS category_grp,
    a.name AS account_name, a.type AS account_type,
    ta.name AS to_account_name
  FROM transactions t
  LEFT JOIN categories c ON c.id = t.category_id
  JOIN accounts a ON a.id = t.account_id
  LEFT JOIN accounts ta ON ta.id = t.to_account_id
`;

export function toTransactionView(r: TransactionViewRow): TransactionView {
  return {
    id: r.id,
    type: r.type,
    amountCents: r.amount_cents,
    date: r.date,
    description: r.description,
    categoryId: r.category_id,
    accountId: r.account_id,
    toAccountId: r.to_account_id,
    billOccurrenceId: r.bill_occurrence_id,
    invoiceMonth: r.invoice_month,
    installment:
      r.installment_group_id && r.installment_no && r.installment_total
        ? { groupId: r.installment_group_id, number: r.installment_no, total: r.installment_total }
        : null,
    source: r.source,
    rawText: r.raw_text,
    category:
      r.category_name && r.category_icon && r.category_color && r.category_grp
        ? { name: r.category_name, icon: r.category_icon, color: r.category_color, group: r.category_grp }
        : null,
    account: { name: r.account_name, type: r.account_type },
    toAccountName: r.to_account_name,
  };
}

export class SqliteTransactionRepository implements TransactionRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async list(f: TransactionFilters) {
    const { start, end } = monthRange(f.month);
    const where = ['t.date BETWEEN ? AND ?'];
    const params: (string | number)[] = [start, end];
    if (f.type) {
      where.push('t.type = ?');
      params.push(f.type);
    }
    if (f.categoryId) {
      where.push('t.category_id = ?');
      params.push(f.categoryId);
    }
    if (f.accountId) {
      where.push('(t.account_id = ? OR t.to_account_id = ?)');
      params.push(f.accountId, f.accountId);
    }
    const search = f.search?.trim();
    if (search) {
      where.push('(t.description LIKE ? OR c.name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    const rows = await this.db.getAllAsync<TransactionViewRow>(
      `${SELECT_TRANSACTION_VIEW} WHERE ${where.join(' AND ')} ORDER BY t.date DESC, t.id DESC`,
      params,
    );
    return rows.map(toTransactionView);
  }

  async recent(limit: number) {
    const rows = await this.db.getAllAsync<TransactionViewRow>(
      `${SELECT_TRANSACTION_VIEW} WHERE t.date <= date('now', 'localtime') ORDER BY t.date DESC, t.id DESC LIMIT ?`,
      [limit],
    );
    return rows.map(toTransactionView);
  }

  async findById(id: number) {
    const row = await this.db.getFirstAsync<TransactionViewRow>(`${SELECT_TRANSACTION_VIEW} WHERE t.id = ?`, [id]);
    return row ? toTransactionView(row) : null;
  }

  async idsInInstallmentGroup(groupId: string) {
    const rows = await this.db.getAllAsync<{ id: number }>(
      'SELECT id FROM transactions WHERE installment_group_id = ? ORDER BY installment_no',
      [groupId],
    );
    return rows.map((r) => r.id);
  }

  async insert(t: NewTransaction) {
    const res = await this.db.runAsync(
      `INSERT INTO transactions
        (type, amount_cents, date, description, category_id, account_id, to_account_id, bill_occurrence_id,
         invoice_month, installment_group_id, installment_no, installment_total, source, raw_text)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        t.type,
        t.amountCents,
        t.date,
        t.description,
        t.categoryId,
        t.accountId,
        t.toAccountId,
        t.billOccurrenceId,
        t.invoiceMonth,
        t.installment?.groupId ?? null,
        t.installment?.number ?? null,
        t.installment?.total ?? null,
        t.source,
        t.rawText,
      ],
    );
    return res.lastInsertRowId;
  }

  async update(id: number, c: TransactionChanges) {
    await this.db.runAsync(
      `UPDATE transactions
       SET amount_cents = ?, date = ?, description = ?, category_id = ?, account_id = ?, invoice_month = ?
       WHERE id = ?`,
      [c.amountCents, c.date, c.description, c.categoryId, c.accountId, c.invoiceMonth, id],
    );
  }

  async delete(ids: number[]) {
    if (!ids.length) return;
    await this.db.runAsync(`DELETE FROM transactions WHERE id IN (${placeholders(ids.length)})`, ids);
  }
}
