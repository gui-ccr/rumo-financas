/**
 * Migration 6 (driving mode) on real SQLite: the schema constraints, the Nubank seed, and an upgrade
 * from a database that already has data.
 */
import { parsePixNotification } from '@/features/shifts/domain/parse-pix-notification';

import { MIGRATIONS, migrate } from '../migrations';
import { seed } from '../seed';
import { openTestDb } from '../testing/sqlite-adapter';

const count = (db: { prepare: (s: string) => { get: () => unknown } }, table: string) =>
  (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;

const CAPTURE_SQL = `INSERT INTO notification_captures (capture_key, package_name, posted_at, status)
  VALUES (?, 'com.nu.production', '2026-11-23T19:30:00.000Z', 'unmatched')`;

describe('migration 6: driving mode schema', () => {
  it('seeds the Nubank Pix rule, active, and it reads a real-looking notification', async () => {
    const { db, asDb } = openTestDb();
    await migrate(asDb());

    const rule = db.prepare("SELECT * FROM notification_rules WHERE package_name = 'com.nu.production'").get() as {
      id: number;
      name: string;
      title_pattern: string;
      text_pattern: string;
      active: number;
    };
    expect(rule).toMatchObject({ name: 'Nubank — Pix recebido', title_pattern: 'Pix recebido|Transfer[êe]ncia recebida', active: 1 });

    const receipt = parsePixNotification(
      {
        packageName: 'com.nu.production',
        title: 'Transferência recebida',
        text: 'Você recebeu uma transferência de R$ 50,00 de FULANO DE TAL.',
        bigText: null,
      },
      [{ id: rule.id, name: rule.name, packageName: 'com.nu.production', titlePattern: rule.title_pattern, textPattern: rule.text_pattern, active: true }],
    );
    expect(receipt).toEqual({ ruleId: rule.id, amountCents: 5000, payer: 'FULANO DE TAL' });
  });

  it('allows one active shift at a time, and only the known statuses', async () => {
    const { db, asDb } = openTestDb();
    await migrate(asDb());
    const insertShift = (status: string) =>
      db
        .prepare('INSERT INTO shifts (started_at, status, category_id, account_id) VALUES (?, ?, 1, 1)')
        .run('2026-11-23T19:00:00.000Z', status);

    insertShift('active');
    expect(() => insertShift('active')).toThrow(/UNIQUE/);
    insertShift('reviewing');
    insertShift('confirmed');
    expect(() => insertShift('pending')).toThrow();
  });

  it('keeps one row per notification key, and refuses a negative reported total', async () => {
    const { db, asDb } = openTestDb();
    await migrate(asDb());
    db.prepare(CAPTURE_SQL).run('k1');
    expect(() => db.prepare(CAPTURE_SQL).run('k1')).toThrow(/UNIQUE/);

    db.prepare("INSERT INTO shifts (started_at, status, category_id, account_id) VALUES ('2026-11-23T19:00:00.000Z', 'reviewing', 1, 1)").run();
    expect(() => db.prepare('UPDATE shifts SET reported_total_cents = -1').run()).toThrow();
  });

  it('refuses a capture status outside the known set and a non-positive amount', async () => {
    const { db, asDb } = openTestDb();
    await migrate(asDb());
    expect(() =>
      db.prepare("INSERT INTO notification_captures (capture_key, package_name, posted_at, status) VALUES ('x', 'a', 'b', 'bogus')").run(),
    ).toThrow();
    expect(() =>
      db
        .prepare("INSERT INTO notification_captures (capture_key, package_name, posted_at, status, amount_cents) VALUES ('y', 'a', 'b', 'unmatched', 0)")
        .run(),
    ).toThrow();
  });

  it('upgrades a database at version 5 without losing its data, and seeds the rule once', async () => {
    const { db, asDb } = openTestDb();

    // The schema as shipped before this migration, with real data in it.
    for (const sql of MIGRATIONS.slice(0, 5)) db.exec(sql);
    await seed(asDb());
    db.exec('PRAGMA user_version = 5');
    const nubank = (db.prepare("SELECT id FROM accounts WHERE name = 'Nubank'").get() as { id: number }).id;
    const salario = (db.prepare("SELECT id FROM categories WHERE name = 'Salário'").get() as { id: number }).id;
    db.prepare(
      `INSERT INTO transactions (type, amount_cents, date, description, category_id, account_id)
       VALUES ('income', 150000, '2026-11-05', 'Salário', ?, ?)`,
    ).run(salario, nubank);

    const before = { accounts: count(db, 'accounts'), transactions: count(db, 'transactions') };
    await migrate(asDb());

    expect((db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version).toBe(MIGRATIONS.length);
    expect({ accounts: count(db, 'accounts'), transactions: count(db, 'transactions') }).toEqual(before);
    expect(count(db, 'notification_rules')).toBe(1);
    expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);

    // Running it again does nothing: the seed is not inserted twice.
    await migrate(asDb());
    expect(count(db, 'notification_rules')).toBe(1);
  });
});
