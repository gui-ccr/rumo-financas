import type { SQLiteDatabase } from 'expo-sqlite';

import type { ISODate } from '@/shared/domain/dates';
import { toBool } from '@/shared/infrastructure/database/sql';

import type { Account, AccountBalance, AccountType } from '../domain/account';
import type { AccountData, AccountRepository } from '../domain/repositories';

type AccountRow = {
  id: number;
  name: string;
  type: AccountType;
  initial_balance_cents: number;
  closing_day: number | null;
  due_day: number | null;
  color: string;
  archived: number;
};

const toAccount = (r: AccountRow): Account => ({
  id: r.id,
  name: r.name,
  type: r.type,
  initialBalanceCents: r.initial_balance_cents,
  closingDay: r.closing_day,
  dueDay: r.due_day,
  color: r.color,
  archived: toBool(r.archived),
});

export class SqliteAccountRepository implements AccountRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async list() {
    const rows = await this.db.getAllAsync<AccountRow>('SELECT * FROM accounts WHERE archived = 0 ORDER BY sort, id');
    return rows.map(toAccount);
  }

  async findById(id: number) {
    const row = await this.db.getFirstAsync<AccountRow>('SELECT * FROM accounts WHERE id = ?', [id]);
    return row ? toAccount(row) : null;
  }

  async create(a: AccountData) {
    const res = await this.db.runAsync(
      `INSERT INTO accounts (name, type, initial_balance_cents, closing_day, due_day, color, sort)
       VALUES (?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort), 0) + 1 FROM accounts))`,
      [a.name, a.type, a.initialBalanceCents, a.closingDay, a.dueDay, a.color],
    );
    return res.lastInsertRowId;
  }

  async update(id: number, a: AccountData) {
    await this.db.runAsync(
      `UPDATE accounts SET name = ?, type = ?, initial_balance_cents = ?, closing_day = ?, due_day = ?, color = ?
       WHERE id = ?`,
      [a.name, a.type, a.initialBalanceCents, a.closingDay, a.dueDay, a.color, id],
    );
  }

  async archive(id: number) {
    await this.db.runAsync('UPDATE accounts SET archived = 1 WHERE id = ?', [id]);
  }

  /** initial + income - expense - transfers out + transfers in, up to a date. */
  async balances(upTo: ISODate): Promise<AccountBalance[]> {
    const rows = await this.db.getAllAsync<{ id: number; name: string; type: AccountType; color: string; balance: number }>(
      `SELECT a.id, a.name, a.type, a.color,
         a.initial_balance_cents + COALESCE(SUM(
           CASE
             WHEN t.type = 'income'   AND t.account_id = a.id    THEN t.amount_cents
             WHEN t.type = 'expense'  AND t.account_id = a.id    THEN -t.amount_cents
             WHEN t.type = 'transfer' AND t.account_id = a.id    THEN -t.amount_cents
             WHEN t.type = 'transfer' AND t.to_account_id = a.id THEN t.amount_cents
           END), 0) AS balance
       FROM accounts a
       LEFT JOIN transactions t ON (t.account_id = a.id OR t.to_account_id = a.id) AND t.date <= ?
       WHERE a.archived = 0
       GROUP BY a.id ORDER BY a.sort, a.id`,
      [upTo],
    );
    return rows.map((r) => ({ id: r.id, name: r.name, type: r.type, color: r.color, balanceCents: r.balance }));
  }
}
