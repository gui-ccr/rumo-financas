import type { SQLiteDatabase } from 'expo-sqlite';

import type { PaymentLinks } from '@/features/transactions/application/delete-transaction';
import type { ISODate } from '@/shared/domain/dates';
import { placeholders, toBool } from '@/shared/infrastructure/database/sql';

import type { Bill, BillOccurrenceView, BillPriority, OccurrenceStatus, Recurrence } from '../domain/bill';
import type { BillData, BillRepository } from '../domain/bill-repository';

type BillRow = {
  id: number;
  name: string;
  amount_cents: number | null;
  category_id: number | null;
  account_id: number | null;
  due_day: number;
  recurrence: Recurrence;
  start_month: string;
  priority: BillPriority;
  repeat_count: number | null;
  notes: string | null;
  active: number;
};

type OccurrenceRow = {
  id: number;
  bill_id: number;
  due_date: string;
  amount_cents: number | null;
  status: OccurrenceStatus;
  transaction_id: number | null;
  bill_name: string;
  recurrence: Recurrence;
  priority: BillPriority;
  category_id: number | null;
  account_id: number | null;
  category_icon: string | null;
  category_color: string | null;
};

const SELECT_OCCURRENCE = `
  SELECT o.id, o.bill_id, o.due_date, o.amount_cents, o.status, o.transaction_id,
    b.name AS bill_name, b.recurrence, b.priority, b.category_id, b.account_id,
    c.icon AS category_icon, c.color AS category_color
  FROM bill_occurrences o
  JOIN bills b ON b.id = o.bill_id
  LEFT JOIN categories c ON c.id = b.category_id
`;

const toBill = (r: BillRow): Bill => ({
  id: r.id,
  name: r.name,
  amountCents: r.amount_cents,
  categoryId: r.category_id,
  accountId: r.account_id,
  dueDay: r.due_day,
  recurrence: r.recurrence,
  startMonth: r.start_month,
  priority: r.priority,
  repeatCount: r.repeat_count ?? null,
  notes: r.notes ?? null,
  active: toBool(r.active),
});

const toOccurrence = (r: OccurrenceRow): BillOccurrenceView => ({
  id: r.id,
  billId: r.bill_id,
  dueDate: r.due_date,
  amountCents: r.amount_cents,
  status: r.status,
  transactionId: r.transaction_id,
  billName: r.bill_name,
  recurrence: r.recurrence,
  priority: r.priority,
  categoryId: r.category_id,
  accountId: r.account_id,
  category: r.category_icon && r.category_color ? { icon: r.category_icon, color: r.category_color } : null,
});

/** Also implements PaymentLinks so deleting a payment reopens its bill. */
export class SqliteBillRepository implements BillRepository, PaymentLinks {
  constructor(private readonly db: SQLiteDatabase) {}

  async findById(id: number) {
    const row = await this.db.getFirstAsync<BillRow>('SELECT * FROM bills WHERE id = ?', [id]);
    return row ? toBill(row) : null;
  }

  async listActive() {
    const rows = await this.db.getAllAsync<BillRow>('SELECT * FROM bills WHERE active = 1');
    return rows.map(toBill);
  }

  async create(b: BillData) {
    const res = await this.db.runAsync(
      `INSERT INTO bills (name, amount_cents, category_id, account_id, due_day, recurrence, start_month, priority, repeat_count, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        b.name,
        b.amountCents,
        b.categoryId,
        b.accountId,
        b.dueDay,
        b.recurrence,
        b.startMonth,
        b.priority,
        b.repeatCount,
        b.notes,
      ],
    );
    return res.lastInsertRowId;
  }

  async update(id: number, b: BillData) {
    await this.db.runAsync(
      `UPDATE bills SET name = ?, amount_cents = ?, category_id = ?, account_id = ?, due_day = ?, recurrence = ?, start_month = ?, priority = ?,
         repeat_count = ?, notes = ?
       WHERE id = ?`,
      [
        b.name,
        b.amountCents,
        b.categoryId,
        b.accountId,
        b.dueDay,
        b.recurrence,
        b.startMonth,
        b.priority,
        b.repeatCount,
        b.notes,
        id,
      ],
    );
  }

  async deactivate(id: number) {
    await this.db.runAsync('UPDATE bills SET active = 0 WHERE id = ?', [id]);
  }

  async findOccurrence(id: number) {
    const row = await this.db.getFirstAsync<OccurrenceRow>(`${SELECT_OCCURRENCE} WHERE o.id = ?`, [id]);
    return row ? toOccurrence(row) : null;
  }

  async occurrenceDates(billId: number) {
    const rows = await this.db.getAllAsync<{ due_date: string }>(
      'SELECT due_date FROM bill_occurrences WHERE bill_id = ?',
      [billId],
    );
    return rows.map((r) => r.due_date);
  }

  async addOccurrence(billId: number, dueDate: ISODate, amountCents: number | null) {
    await this.db.runAsync(
      'INSERT OR IGNORE INTO bill_occurrences (bill_id, due_date, amount_cents) VALUES (?, ?, ?)',
      [billId, dueDate, amountCents],
    );
  }

  async deletePendingOccurrences(billId: number) {
    await this.db.runAsync("DELETE FROM bill_occurrences WHERE bill_id = ? AND status = 'pending'", [billId]);
  }

  async occurrencesWithOverdue(from: ISODate, to: ISODate) {
    const rows = await this.db.getAllAsync<OccurrenceRow>(
      `${SELECT_OCCURRENCE}
       WHERE (o.due_date BETWEEN ? AND ?) OR (o.status = 'pending' AND o.due_date < ?)
       ORDER BY o.due_date, b.name`,
      [from, to, from],
    );
    return rows.map(toOccurrence);
  }

  async pendingUntil(to: ISODate) {
    const rows = await this.db.getAllAsync<OccurrenceRow>(
      `${SELECT_OCCURRENCE} WHERE o.status = 'pending' AND o.due_date <= ? ORDER BY o.due_date, b.name`,
      [to],
    );
    return rows.map(toOccurrence);
  }

  async listPending() {
    const rows = await this.db.getAllAsync<OccurrenceRow>(
      `${SELECT_OCCURRENCE} WHERE o.status = 'pending' ORDER BY o.due_date, b.name`,
    );
    return rows.map(toOccurrence);
  }

  async occurrencesOfBill(billId: number) {
    const rows = await this.db.getAllAsync<OccurrenceRow>(
      `${SELECT_OCCURRENCE} WHERE o.bill_id = ? ORDER BY o.due_date`,
      [billId],
    );
    return rows.map(toOccurrence);
  }

  async markPaid(id: number, transactionId: number, amountCents: number) {
    await this.db.runAsync(
      "UPDATE bill_occurrences SET status = 'paid', transaction_id = ?, amount_cents = ? WHERE id = ?",
      [transactionId, amountCents, id],
    );
  }

  async reopenByTransactions(ids: number[]) {
    if (!ids.length) return;
    await this.db.runAsync(
      `UPDATE bill_occurrences SET status = 'pending', transaction_id = NULL
       WHERE transaction_id IN (${placeholders(ids.length)})`,
      ids,
    );
  }

  releaseByTransactions(ids: number[]) {
    return this.reopenByTransactions(ids);
  }
}
