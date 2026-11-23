/**
 * Bills against real SQLite, reproducing what the user saw on the device:
 *  1. one monthly bill showed up as several open items, and the plan summed them;
 *  2. editing a bill after paying one of its months created a second item in that month;
 *  3. paying a bill registered without a category failed with no way to fix it.
 * The clock is fixed at 2026-11-15.
 */
import { SqliteAccountRepository } from '@/features/accounts/infrastructure/sqlite-account-repository';
import { GetIncomes } from '@/features/incomes/application/get-incomes';
import { SyncIncomes } from '@/features/incomes/application/sync-incomes';
import { SqliteIncomeRepository } from '@/features/incomes/infrastructure/sqlite-income-repository';
import { CreateTransaction } from '@/features/transactions/application/create-transaction';
import { SqliteTransactionRepository } from '@/features/transactions/infrastructure/sqlite-transaction-repository';
import { DomainError } from '@/shared/domain/errors';
import { migrate } from '@/shared/infrastructure/database/migrations';
import { SqliteUnitOfWork } from '@/shared/infrastructure/database/sqlite-unit-of-work';
import { openTestDb } from '@/shared/infrastructure/database/testing/sqlite-adapter';

import { SqliteBillRepository } from '../../infrastructure/sqlite-bill-repository';
import { GetPaymentPlan } from '../get-payment-plan';
import { PayBill } from '../pay-bill';
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
  const one = (sql: string) => (db.prepare(sql).get() as { id: number }).id;

  const accounts = new SqliteAccountRepository(adapter);
  const transactions = new SqliteTransactionRepository(adapter);
  const bills = new SqliteBillRepository(adapter);
  const incomes = new SqliteIncomeRepository(adapter);
  const uow = new SqliteUnitOfWork(adapter);
  const sync = new SyncOccurrences(bills);
  const createTransaction = new CreateTransaction(accounts, transactions, uow, () => 'g');
  return {
    db,
    nubank: one("SELECT id FROM accounts WHERE name = 'Nubank'"),
    aluguel: one("SELECT id FROM categories WHERE name = 'Aluguel'"),
    bills,
    save: new SaveBill(bills, sync, uow),
    pay: new PayBill(bills, createTransaction, uow),
    plan: new GetPaymentPlan(accounts, bills, new GetIncomes(incomes)),
    syncIncomes: new SyncIncomes(incomes),
    db_: db,
  };
}

const internet = (over: Partial<BillInput> = {}): BillInput => ({
  name: 'Internet',
  amountCents: 36000,
  categoryId: null,
  accountId: null,
  dueDay: 10,
  recurrence: 'monthly',
  startMonth: '2026-11',
  priority: 'essential',
  ...over,
});

describe('one monthly bill', () => {
  it('has at most one open item per month (months ahead are materialized for reminders, not repeated)', async () => {
    const s = await setup();
    const id = await s.save.execute(internet());
    const open = s.db_
      .prepare("SELECT substr(due_date, 1, 7) AS month FROM bill_occurrences WHERE bill_id = ? AND status = 'pending'")
      .all(id) as { month: string }[];
    const perMonth = new Map<string, number>();
    for (const { month } of open) perMonth.set(month, (perMonth.get(month) ?? 0) + 1);
    expect(open.length).toBeGreaterThan(0);
    expect([...perMonth.values()].every((n) => n === 1)).toBe(true);
  });

  it('the plan counts this month only, so R$ 360 stays R$ 360 for the shortfall', async () => {
    const s = await setup();
    await s.save.execute(internet());
    const plan = await s.plan.execute('2026-11-15');
    expect(plan.items).toHaveLength(1);
    expect(plan.shortfallCents).toBe(36000);
  });

  it('keeps one item per month when the due day is edited after paying', async () => {
    const s = await setup();
    const id = await s.save.execute(internet({ dueDay: 5 }));
    const nov = s.db_
      .prepare("SELECT id FROM bill_occurrences WHERE bill_id = ? AND due_date = '2026-11-05'")
      .get(id) as { id: number };
    await s.pay.execute(nov.id, { amountCents: 36000, accountId: s.nubank, categoryId: s.aluguel, date: '2026-11-05' });

    await s.save.execute(internet({ dueDay: 10 }), id);
    const november = s.db_
      .prepare("SELECT status FROM bill_occurrences WHERE bill_id = ? AND substr(due_date, 1, 7) = '2026-11'")
      .all(id) as { status: string }[];
    expect(november.map((o) => o.status)).toEqual(['paid']);
  });
});

describe('paying a bill', () => {
  it('refuses with a clear message when the bill has no category and none is given', async () => {
    const s = await setup();
    const id = await s.save.execute(internet({ categoryId: null }));
    const occ = s.db_.prepare('SELECT id FROM bill_occurrences WHERE bill_id = ?').get(id) as { id: number };
    await expect(
      s.pay.execute(occ.id, { amountCents: 36000, accountId: s.nubank, categoryId: null, date: '2026-11-15' }),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it('pays with the category chosen at payment time, marking the item paid and creating the expense', async () => {
    const s = await setup();
    const id = await s.save.execute(internet({ categoryId: null }));
    const occ = s.db_.prepare('SELECT id FROM bill_occurrences WHERE bill_id = ?').get(id) as { id: number };
    await s.pay.execute(occ.id, { amountCents: 36000, accountId: s.nubank, categoryId: s.aluguel, date: '2026-11-15' });
    const row = s.db_
      .prepare("SELECT status, transaction_id FROM bill_occurrences WHERE id = ?")
      .get(occ.id) as { status: string; transaction_id: number | null };
    expect(row.status).toBe('paid');
    expect(row.transaction_id).not.toBeNull();
  });
});
