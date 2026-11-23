/**
 * The bill detail read model against real SQLite: open dues next first, paid history newest first,
 * and the names of the account and category the bill points to.
 */
import { SqliteAccountRepository } from '@/features/accounts/infrastructure/sqlite-account-repository';
import { SqliteCategoryRepository } from '@/features/accounts/infrastructure/sqlite-category-repository';
import { CreateTransaction } from '@/features/transactions/application/create-transaction';
import { SqliteTransactionRepository } from '@/features/transactions/infrastructure/sqlite-transaction-repository';
import { migrate } from '@/shared/infrastructure/database/migrations';
import { SqliteUnitOfWork } from '@/shared/infrastructure/database/sqlite-unit-of-work';
import { openTestDb } from '@/shared/infrastructure/database/testing/sqlite-adapter';

import { SqliteBillRepository } from '../../infrastructure/sqlite-bill-repository';
import { GetBillDetail } from '../get-bill-detail';
import { PayBill } from '../pay-bill';
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
  const one = (sql: string) => (db.prepare(sql).get() as { id: number }).id;
  const accounts = new SqliteAccountRepository(adapter);
  const bills = new SqliteBillRepository(adapter);
  const uow = new SqliteUnitOfWork(adapter);
  const createTransaction = new CreateTransaction(accounts, new SqliteTransactionRepository(adapter), uow, () => 'g');
  return {
    db,
    nubank: one("SELECT id FROM accounts WHERE name = 'Nubank'"),
    luz: one("SELECT id FROM categories WHERE name = 'Luz'"),
    save: new SaveBill(bills, new SyncOccurrences(bills), uow),
    pay: new PayBill(bills, createTransaction, uow),
    detail: new GetBillDetail(bills, accounts, new SqliteCategoryRepository(adapter)),
  };
}

describe('GetBillDetail', () => {
  it('splits open dues (next first) from payments (newest first), with account and category names', async () => {
    const t = await setup();
    const id = await t.save.execute({
      name: 'Energia',
      amountCents: 20000,
      categoryId: t.luz,
      accountId: t.nubank,
      dueDay: 10,
      recurrence: 'monthly',
      startMonth: '2026-10',
      priority: 'essential',
    });
    // October is overdue (open); pay it so there is a payment in history.
    const oct = t.db.prepare("SELECT id FROM bill_occurrences WHERE bill_id = ? AND due_date = '2026-10-10'").get(id) as {
      id: number;
    };
    await t.pay.execute(oct.id, { amountCents: 20000, accountId: t.nubank, categoryId: t.luz, date: '2026-11-02' });

    const detail = await t.detail.execute(id);

    expect(detail).not.toBeNull();
    expect(detail!.accountName).toBe('Nubank');
    expect(detail!.categoryName).toBe('Luz');
    expect(detail!.paid.map((o) => o.dueDate)).toEqual(['2026-10-10']);
    // Nov, Dec and Jan are open (Oct is paid); the next due is the first one.
    expect(detail!.open.map((o) => o.dueDate)).toEqual(['2026-11-10', '2026-12-10', '2027-01-10']);
  });

  it('returns null for a bill that does not exist', async () => {
    const t = await setup();
    expect(await t.detail.execute(9999)).toBeNull();
  });
});
