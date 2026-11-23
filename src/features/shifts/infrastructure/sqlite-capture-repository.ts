import type { SQLiteDatabase } from 'expo-sqlite';

import type { CaptureChanges, CaptureRepository } from '../domain/capture-repository';
import type { CaptureStatus, NewCapture, NotificationCapture } from '../domain/notification-capture';

type CaptureRow = {
  id: number;
  capture_key: string;
  package_name: string;
  title: string | null;
  text: string | null;
  posted_at: string;
  rule_id: number | null;
  amount_cents: number | null;
  payer: string | null;
  status: CaptureStatus;
  shift_id: number | null;
  transaction_id: number | null;
  created_at: string;
};

const toCapture = (r: CaptureRow): NotificationCapture => ({
  id: r.id,
  captureKey: r.capture_key,
  packageName: r.package_name,
  title: r.title,
  text: r.text,
  postedAt: r.posted_at,
  ruleId: r.rule_id,
  amountCents: r.amount_cents,
  payer: r.payer,
  status: r.status,
  shiftId: r.shift_id,
  transactionId: r.transaction_id,
  createdAt: r.created_at,
});

/** Column for each field that can change after a capture is stored. */
const COLUMN: Record<keyof CaptureChanges, string> = {
  amountCents: 'amount_cents',
  status: 'status',
  shiftId: 'shift_id',
  transactionId: 'transaction_id',
};

export class SqliteCaptureRepository implements CaptureRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async findById(id: number) {
    const row = await this.db.getFirstAsync<CaptureRow>('SELECT * FROM notification_captures WHERE id = ?', [id]);
    return row ? toCapture(row) : null;
  }

  async insertIfNew(c: NewCapture) {
    const res = await this.db.runAsync(
      `INSERT OR IGNORE INTO notification_captures
        (capture_key, package_name, title, text, posted_at, rule_id, amount_cents, payer, status, shift_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        c.captureKey,
        c.packageName,
        c.title,
        c.text,
        c.postedAt,
        c.ruleId,
        c.amountCents,
        c.payer,
        c.status,
        c.shiftId,
      ],
    );
    return res.changes === 1;
  }

  async update(id: number, changes: CaptureChanges) {
    const keys = (Object.keys(changes) as (keyof CaptureChanges)[]).filter((k) => changes[k] !== undefined);
    if (keys.length === 0) return;
    const sets = keys.map((k) => `${COLUMN[k]} = ?`).join(', ');
    await this.db.runAsync(
      `UPDATE notification_captures SET ${sets} WHERE id = ?`,
      [...keys.map((k) => changes[k] ?? null), id],
    );
  }

  async listByShift(shiftId: number) {
    const rows = await this.db.getAllAsync<CaptureRow>(
      'SELECT * FROM notification_captures WHERE shift_id = ? ORDER BY posted_at, id',
      [shiftId],
    );
    return rows.map(toCapture);
  }

  async listLearning(limit: number) {
    const rows = await this.db.getAllAsync<CaptureRow>(
      `SELECT * FROM notification_captures
       WHERE status IN ('unmatched', 'outside_shift')
       ORDER BY posted_at DESC, id DESC LIMIT ?`,
      [limit],
    );
    return rows.map(toCapture);
  }
}
