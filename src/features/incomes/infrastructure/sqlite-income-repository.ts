import type { SQLiteDatabase } from 'expo-sqlite';

import type { Recurrence } from '@/features/bills/domain/bill';
import type { PaymentLinks } from '@/features/transactions/application/delete-transaction';
import type { ISODate, MonthKey } from '@/shared/domain/dates';
import { placeholders, toBool } from '@/shared/infrastructure/database/sql';

import type {
  Income,
  IncomeData,
  IncomeKind,
  IncomeOccurrenceStatus,
  IncomeOccurrenceView,
} from '../domain/income';
import type { IncomeRepository } from '../domain/income-repository';

type IncomeRow = {
  id: number;
  name: string;
  kind: IncomeKind;
  expected_cents: number;
  account_id: number;
  category_id: number;
  recurrence: Recurrence | null;
  due_day: number | null;
  start_month: string | null;
  note: string | null;
  archived: number;
};

type OccurrenceRow = {
  id: number;
  income_id: number;
  expected_date: string | null;
  month: string | null;
  expected_cents: number;
  status: IncomeOccurrenceStatus;
  received_transaction_id: number | null;
  income_name: string;
  kind: IncomeKind;
  account_id: number;
  category_id: number;
  category_icon: string | null;
  category_color: string | null;
};

const SELECT_OCCURRENCE = `
  SELECT o.id, o.income_id, o.expected_date, o.month, o.expected_cents, o.status, o.received_transaction_id,
    i.name AS income_name, i.kind, i.account_id, i.category_id,
    c.icon AS category_icon, c.color AS category_color
  FROM income_occurrences o
  JOIN incomes i ON i.id = o.income_id
  LEFT JOIN categories c ON c.id = i.category_id
`;

const toIncome = (r: IncomeRow): Income => ({
  id: r.id,
  name: r.name,
  kind: r.kind,
  expectedCents: r.expected_cents,
  accountId: r.account_id,
  categoryId: r.category_id,
  recurrence: r.recurrence,
  dueDay: r.due_day,
  startMonth: r.start_month,
  note: r.note,
  archived: toBool(r.archived),
});

const toOccurrence = (r: OccurrenceRow): IncomeOccurrenceView => ({
  id: r.id,
  incomeId: r.income_id,
  expectedDate: r.expected_date,
  month: r.month,
  expectedCents: r.expected_cents,
  status: r.status,
  receivedTransactionId: r.received_transaction_id,
  incomeName: r.income_name,
  kind: r.kind,
  accountId: r.account_id,
  categoryId: r.category_id,
  category: r.category_icon && r.category_color ? { icon: r.category_icon, color: r.category_color } : null,
});

/** Also implements PaymentLinks so deleting a receipt transaction reopens its expected income. */
export class SqliteIncomeRepository implements IncomeRepository, PaymentLinks {
  constructor(private readonly db: SQLiteDatabase) {}

  async findById(id: number) {
    const row = await this.db.getFirstAsync<IncomeRow>('SELECT * FROM incomes WHERE id = ?', [id]);
    return row ? toIncome(row) : null;
  }

  async listActive() {
    const rows = await this.db.getAllAsync<IncomeRow>('SELECT * FROM incomes WHERE archived = 0 ORDER BY name');
    return rows.map(toIncome);
  }

  async create(b: IncomeData) {
    const res = await this.db.runAsync(
      `INSERT INTO incomes (name, kind, expected_cents, account_id, category_id, recurrence, due_day, start_month, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [b.name, b.kind, b.expectedCents, b.accountId, b.categoryId, b.recurrence, b.dueDay, b.startMonth, b.note],
    );
    return res.lastInsertRowId;
  }

  async update(id: number, b: IncomeData) {
    await this.db.runAsync(
      `UPDATE incomes SET name = ?, expected_cents = ?, account_id = ?, category_id = ?, recurrence = ?, due_day = ?, start_month = ?, note = ?
       WHERE id = ?`,
      [b.name, b.expectedCents, b.accountId, b.categoryId, b.recurrence, b.dueDay, b.startMonth, b.note, id],
    );
  }

  async archive(id: number) {
    await this.db.runAsync('UPDATE incomes SET archived = 1 WHERE id = ?', [id]);
  }

  async occurrenceDates(incomeId: number) {
    const rows = await this.db.getAllAsync<{ expected_date: string }>(
      'SELECT expected_date FROM income_occurrences WHERE income_id = ? AND expected_date IS NOT NULL',
      [incomeId],
    );
    return rows.map((r) => r.expected_date);
  }

  async addScheduled(incomeId: number, expectedDate: ISODate, month: MonthKey, expectedCents: number) {
    await this.db.runAsync(
      'INSERT OR IGNORE INTO income_occurrences (income_id, expected_date, month, expected_cents) VALUES (?, ?, ?, ?)',
      [incomeId, expectedDate, month, expectedCents],
    );
  }

  async addExpected(incomeId: number, month: MonthKey | null, expectedCents: number) {
    const res = await this.db.runAsync(
      'INSERT INTO income_occurrences (income_id, expected_date, month, expected_cents) VALUES (?, NULL, ?, ?)',
      [incomeId, month, expectedCents],
    );
    return res.lastInsertRowId;
  }

  async deletePendingScheduled(incomeId: number) {
    await this.db.runAsync(
      "DELETE FROM income_occurrences WHERE income_id = ? AND status = 'pending' AND expected_date IS NOT NULL",
      [incomeId],
    );
  }

  async deletePending(incomeId: number) {
    await this.db.runAsync("DELETE FROM income_occurrences WHERE income_id = ? AND status = 'pending'", [incomeId]);
  }

  async findOccurrence(id: number) {
    const row = await this.db.getFirstAsync<OccurrenceRow>(`${SELECT_OCCURRENCE} WHERE o.id = ?`, [id]);
    return row ? toOccurrence(row) : null;
  }

  async listPending() {
    const rows = await this.db.getAllAsync<OccurrenceRow>(
      `${SELECT_OCCURRENCE}
       WHERE o.status = 'pending'
       ORDER BY (o.expected_date IS NULL), o.expected_date, i.name, o.id`,
    );
    return rows.map(toOccurrence);
  }

  async sumExpected(month: MonthKey) {
    const row = await this.db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(expected_cents), 0) AS total FROM income_occurrences WHERE month = ?',
      [month],
    );
    return row?.total ?? 0;
  }

  async markReceived(id: number, transactionId: number) {
    await this.db.runAsync(
      "UPDATE income_occurrences SET status = 'received', received_transaction_id = ? WHERE id = ?",
      [transactionId, id],
    );
  }

  async releaseByTransactions(ids: number[]) {
    if (!ids.length) return;
    await this.db.runAsync(
      `UPDATE income_occurrences SET status = 'pending', received_transaction_id = NULL
       WHERE received_transaction_id IN (${placeholders(ids.length)})`,
      ids,
    );
  }
}
