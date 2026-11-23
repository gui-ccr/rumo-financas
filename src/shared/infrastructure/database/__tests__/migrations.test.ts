/**
 * Runs the real migrate() and seed() against SQLite (see testing/sqlite-adapter).
 * Checks the schema SQL and the upgrade path of a database that already has data.
 */
import { MIGRATIONS, migrate } from '../migrations';
import { seed } from '../seed';
import { openTestDb } from '../testing/sqlite-adapter';

const count = (db: { prepare: (s: string) => { get: () => unknown } }, table: string) =>
  (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;

describe('migrate (real SQL on SQLite)', () => {
  it('installs a fresh database at the latest version, seeding defaults but no income', async () => {
    const { db, asDb } = openTestDb();
    await migrate(asDb());

    const version = db.prepare('PRAGMA user_version').get() as { user_version: number };
    expect(version.user_version).toBe(MIGRATIONS.length);
    expect(count(db, 'accounts')).toBeGreaterThan(0);
    expect(count(db, 'categories')).toBeGreaterThan(0);
    const billColumns = (db.prepare('PRAGMA table_info(bills)').all() as { name: string }[]).map((c) => c.name);
    expect(billColumns).toContain('priority');
    expect(count(db, 'incomes')).toBe(0);
    expect(count(db, 'income_occurrences')).toBe(0);
  });

  it('upgrades an existing database without losing bills, payments or transactions', async () => {
    const { db, asDb } = openTestDb();

    // Schema as shipped before this migration, with real data in it.
    db.exec(MIGRATIONS[0]);
    db.exec(MIGRATIONS[1]);
    await seed(asDb());
    db.exec('PRAGMA user_version = 2');

    const account = db.prepare("SELECT id FROM accounts WHERE name = 'Nubank'").get() as { id: number };
    const category = db.prepare("SELECT id FROM categories WHERE name = 'Aluguel'").get() as { id: number };
    db.prepare(
      `INSERT INTO bills (name, amount_cents, category_id, account_id, due_day, recurrence, start_month)
       VALUES ('Aluguel', 150000, ?, ?, 10, 'monthly', '2026-01')`,
    ).run(category.id, account.id);
    db.prepare(
      `INSERT INTO transactions (type, amount_cents, date, description, category_id, account_id)
       VALUES ('expense', 150000, '2026-10-10', 'Aluguel', ?, ?)`,
    ).run(category.id, account.id);
    const tx = db.prepare('SELECT last_insert_rowid() AS id').get() as { id: number };
    db.prepare(
      `INSERT INTO bill_occurrences (bill_id, due_date, amount_cents, status, transaction_id)
       VALUES (1, '2026-10-10', 150000, 'paid', ?)`,
    ).run(tx.id);

    const snapshot = () => ({
      bills: count(db, 'bills'),
      occurrences: count(db, 'bill_occurrences'),
      transactions: count(db, 'transactions'),
      accounts: count(db, 'accounts'),
    });
    const before = snapshot();

    await migrate(asDb());

    const version = db.prepare('PRAGMA user_version').get() as { user_version: number };
    expect(version.user_version).toBe(MIGRATIONS.length);
    expect(snapshot()).toEqual(before);

    const bill = db.prepare("SELECT name, amount_cents, priority FROM bills WHERE name = 'Aluguel'").get();
    expect(bill).toEqual({ name: 'Aluguel', amount_cents: 150000, priority: 'important' });

    const paid = db.prepare('SELECT status, transaction_id FROM bill_occurrences WHERE bill_id = 1').get();
    expect(paid).toEqual({ status: 'paid', transaction_id: tx.id });
    expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);

    // Running it again does nothing.
    await migrate(asDb());
    expect(snapshot()).toEqual(before);
  });

  it('keeps the new constraints: priority is restricted, and a received income survives its transaction being removed', async () => {
    const { db, asDb } = openTestDb();
    await migrate(asDb());

    expect(() =>
      db
        .prepare(
          `INSERT INTO bills (name, due_day, recurrence, start_month, priority) VALUES ('X', 5, 'monthly', '2026-01', 'urgent')`,
        )
        .run(),
    ).toThrow();

    const account = db.prepare('SELECT id FROM accounts LIMIT 1').get() as { id: number };
    const category = db.prepare("SELECT id FROM categories WHERE kind = 'income' LIMIT 1").get() as { id: number };
    db.prepare(
      `INSERT INTO incomes (name, kind, expected_cents, account_id, category_id, recurrence, due_day, start_month)
       VALUES ('Salário', 'fixed', 500000, ?, ?, 'monthly', 5, '2026-01')`,
    ).run(account.id, category.id);
    db.prepare(
      `INSERT INTO income_occurrences (income_id, expected_date, month, expected_cents) VALUES (1, '2026-11-05', '2026-11', 500000)`,
    ).run();
    db.prepare(
      `INSERT INTO transactions (type, amount_cents, date, description, category_id, account_id)
       VALUES ('income', 500000, '2026-11-05', 'Salário', ?, ?)`,
    ).run(category.id, account.id);
    const tx = db.prepare('SELECT last_insert_rowid() AS id').get() as { id: number };
    db.prepare(`UPDATE income_occurrences SET status = 'received', received_transaction_id = ? WHERE id = 1`).run(tx.id);

    db.prepare('DELETE FROM transactions WHERE id = ?').run(tx.id);
    const occ = db.prepare('SELECT received_transaction_id FROM income_occurrences WHERE id = 1').get() as {
      received_transaction_id: number | null;
    };
    expect(occ.received_transaction_id).toBeNull();
  });
});
