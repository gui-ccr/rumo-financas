import type { SQLiteDatabase } from 'expo-sqlite';

import type { ShiftRepository, ShiftSummaryRow, NewShift } from '../domain/shift-repository';
import type { Shift, ShiftStatus } from '../domain/shift';

type ShiftRow = {
  id: number;
  started_at: string;
  ended_at: string | null;
  status: ShiftStatus;
  category_id: number;
  account_id: number;
  reported_total_cents: number | null;
  created_at: string;
};

const toShift = (r: ShiftRow): Shift => ({
  id: r.id,
  startedAt: r.started_at,
  endedAt: r.ended_at,
  status: r.status,
  categoryId: r.category_id,
  accountId: r.account_id,
  reportedTotalCents: r.reported_total_cents,
  createdAt: r.created_at,
});

type SummaryRow = ShiftRow & {
  category_name: string | null;
  account_name: string;
  capture_count: number;
  total_cents: number;
};

export class SqliteShiftRepository implements ShiftRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async findById(id: number) {
    const row = await this.db.getFirstAsync<ShiftRow>('SELECT * FROM shifts WHERE id = ?', [id]);
    return row ? toShift(row) : null;
  }

  async findActive() {
    const row = await this.db.getFirstAsync<ShiftRow>("SELECT * FROM shifts WHERE status = 'active' LIMIT 1");
    return row ? toShift(row) : null;
  }

  async insert(data: NewShift) {
    const res = await this.db.runAsync(
      "INSERT INTO shifts (started_at, status, category_id, account_id) VALUES (?, 'active', ?, ?)",
      [data.startedAt, data.categoryId, data.accountId],
    );
    return res.lastInsertRowId;
  }

  async setStatus(id: number, status: ShiftStatus, endedAt?: string) {
    await this.db.runAsync('UPDATE shifts SET status = ?, ended_at = COALESCE(?, ended_at) WHERE id = ?', [
      status,
      endedAt ?? null,
      id,
    ]);
  }

  async setReportedTotal(id: number, cents: number | null) {
    await this.db.runAsync('UPDATE shifts SET reported_total_cents = ? WHERE id = ?', [cents, id]);
  }

  async summaries() {
    // Included captures: in_shift while the shift is open, confirmed once it became income.
    const rows = await this.db.getAllAsync<SummaryRow>(
      `SELECT s.*, c.name AS category_name, a.name AS account_name,
         (SELECT COUNT(*) FROM notification_captures n
          WHERE n.shift_id = s.id AND n.status IN ('in_shift', 'confirmed')) AS capture_count,
         (SELECT COALESCE(SUM(n.amount_cents), 0) FROM notification_captures n
          WHERE n.shift_id = s.id AND n.status IN ('in_shift', 'confirmed')) AS total_cents
       FROM shifts s
       LEFT JOIN categories c ON c.id = s.category_id
       JOIN accounts a ON a.id = s.account_id
       ORDER BY s.started_at DESC, s.id DESC`,
    );
    return rows.map(
      (r): ShiftSummaryRow => ({
        shift: toShift(r),
        categoryName: r.category_name,
        accountName: r.account_name,
        count: r.capture_count,
        totalCents: r.total_cents,
      }),
    );
  }
}
