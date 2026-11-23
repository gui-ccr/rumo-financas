/**
 * The data migration that removes extra items per bill and month (BILL_DEDUPE_SQL, migration 5),
 * run against rows shaped like the ones earlier builds left on the device.
 */
import { migrate, BILL_DEDUPE_SQL } from '@/shared/infrastructure/database/migrations';
import { openTestDb } from '@/shared/infrastructure/database/testing/sqlite-adapter';

function setup() {
  const { db, asDb } = openTestDb();
  return { db, asDb, migrated: migrate(asDb()) };
}

/** A bill whose due day is 10, with items inserted directly, the way the old build left them. */
function insertBill(db: ReturnType<typeof openTestDb>['db'], dueDay = 10) {
  const res = db
    .prepare(
      `INSERT INTO bills (name, amount_cents, due_day, recurrence, start_month, priority)
       VALUES ('Internet', 36000, ?, 'monthly', '2026-11', 'essential')`,
    )
    .run(dueDay);
  return Number(res.lastInsertRowid);
}

function addItem(db: ReturnType<typeof openTestDb>['db'], billId: number, due: string, status: 'pending' | 'paid') {
  const res = db
    .prepare(
      `INSERT INTO bill_occurrences (bill_id, due_date, amount_cents, status) VALUES (?, ?, 36000, ?)`,
    )
    .run(billId, due, status);
  return Number(res.lastInsertRowid);
}

function itemsOf(db: ReturnType<typeof openTestDb>['db'], billId: number) {
  return (db.prepare('SELECT due_date, status FROM bill_occurrences WHERE bill_id = ? ORDER BY due_date').all(billId) as {
    due_date: string;
    status: string;
  }[]).map((r) => `${r.due_date} ${r.status}`);
}

describe('BILL_DEDUPE_SQL', () => {
  it('removes open items of a month whose paid item already exists, and keeps the paid one', async () => {
    const { db, asDb, migrated } = setup();
    await migrated;
    const bill = insertBill(db, 10);
    addItem(db, bill, '2026-11-05', 'paid');
    addItem(db, bill, '2026-11-10', 'pending');
    addItem(db, bill, '2026-12-10', 'pending');

    await asDb().execAsync(BILL_DEDUPE_SQL);

    expect(itemsOf(db, bill)).toEqual(['2026-11-05 paid', '2026-12-10 pending']);
  });

  it('keeps one open item per month: the one on the bill’s current due day, otherwise the earliest', async () => {
    const { db, asDb, migrated } = setup();
    await migrated;
    const bill = insertBill(db, 10);
    addItem(db, bill, '2026-11-05', 'pending');
    addItem(db, bill, '2026-11-10', 'pending');
    addItem(db, bill, '2026-12-03', 'pending');
    addItem(db, bill, '2026-12-07', 'pending');

    await asDb().execAsync(BILL_DEDUPE_SQL);

    expect(itemsOf(db, bill)).toEqual(['2026-11-10 pending', '2026-12-03 pending']);
  });

  it('never deletes paid items, even when a month has several', async () => {
    const { db, asDb, migrated } = setup();
    await migrated;
    const bill = insertBill(db, 10);
    addItem(db, bill, '2026-11-05', 'paid');
    addItem(db, bill, '2026-11-10', 'paid');

    await asDb().execAsync(BILL_DEDUPE_SQL);

    expect(itemsOf(db, bill)).toEqual(['2026-11-05 paid', '2026-11-10 paid']);
  });

  it('leaves bills alone when each month has one item', async () => {
    const { db, asDb, migrated } = setup();
    await migrated;
    const bill = insertBill(db, 10);
    addItem(db, bill, '2026-11-10', 'pending');
    addItem(db, bill, '2026-12-10', 'pending');

    await asDb().execAsync(BILL_DEDUPE_SQL);

    expect(itemsOf(db, bill)).toEqual(['2026-11-10 pending', '2026-12-10 pending']);
  });
});
