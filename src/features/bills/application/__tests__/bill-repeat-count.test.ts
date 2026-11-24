/**
 * A bill with a number of times, against real SQLite. The clock is fixed at 2026-11-15.
 */
import { migrate } from '@/shared/infrastructure/database/migrations';
import { SqliteUnitOfWork } from '@/shared/infrastructure/database/sqlite-unit-of-work';
import { openTestDb } from '@/shared/infrastructure/database/testing/sqlite-adapter';

import { SqliteBillRepository } from '../../infrastructure/sqlite-bill-repository';
import type { BillInput } from '../schemas';
import { SaveBill } from '../save-bill';
import { SyncOccurrences } from '../sync-occurrences';

beforeAll(() => {
  jest.useFakeTimers({ now: new Date(2026, 10, 15, 12, 0, 0) });
});
afterAll(() => {
  jest.useRealTimers();
});

async function setup() {
  const { db, asDb } = openTestDb();
  await migrate(asDb());
  const adapter = asDb();
  const bills = new SqliteBillRepository(adapter);
  const uow = new SqliteUnitOfWork(adapter);
  return { db, bills, save: new SaveBill(bills, new SyncOccurrences(bills), uow) };
}

const seguro = (over: Partial<BillInput> = {}): BillInput => ({
  name: 'Seguro do carro',
  amountCents: 9_000,
  categoryId: null,
  accountId: null,
  dueDay: 10,
  recurrence: 'monthly',
  startMonth: '2026-09',
  priority: 'important',
  repeatCount: 3,
  notes: 'Parcelado em 3 vezes',
  ...over,
});

describe('bill with a number of times (real SQLite)', () => {
  it('"Algumas vezes" with 3 creates exactly 3 due dates, although the horizon reaches further', async () => {
    const t = await setup();
    const id = await t.save.execute(seguro());
    const dues = t.db.prepare('SELECT due_date FROM bill_occurrences WHERE bill_id = ? ORDER BY due_date').all(id) as {
      due_date: string;
    }[];
    // Starts in September: the horizon (two months ahead of November) would allow Sep to Jan, five dues.
    expect(dues.map((d) => d.due_date)).toEqual(['2026-09-10', '2026-10-10', '2026-11-10']);
  });

  it('a bill without a count keeps the horizon behaviour', async () => {
    const t = await setup();
    const id = await t.save.execute(seguro({ repeatCount: null }));
    const dues = t.db.prepare('SELECT due_date FROM bill_occurrences WHERE bill_id = ?').all(id);
    expect(dues).toHaveLength(5);
  });

  it('stores the count and the note, and reads them back', async () => {
    const t = await setup();
    const id = await t.save.execute(seguro());
    expect(await t.bills.findById(id)).toMatchObject({ repeatCount: 3, notes: 'Parcelado em 3 vezes' });
  });

  it('a blank note is stored as no note', async () => {
    const t = await setup();
    const id = await t.save.execute(seguro({ notes: '   ', repeatCount: null }));
    expect(await t.bills.findById(id)).toMatchObject({ repeatCount: null, notes: null });
  });

  it('editing the count to 2 leaves exactly the two open dues', async () => {
    const t = await setup();
    const id = await t.save.execute(seguro({ repeatCount: null }));
    await t.save.execute(seguro({ repeatCount: 2 }), id);
    const dues = t.db.prepare('SELECT due_date FROM bill_occurrences WHERE bill_id = ? ORDER BY due_date').all(id) as {
      due_date: string;
    }[];
    expect(dues.map((d) => d.due_date)).toEqual(['2026-09-10', '2026-10-10']);
  });
});
