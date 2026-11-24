/**
 * Payment plan against real SQLite: bills, incomes, balance and the plan use case together.
 * The clock is fixed at 2026-11-15.
 */
import { SqliteAccountRepository } from '@/features/accounts/infrastructure/sqlite-account-repository';
import { SaveIncome } from '@/features/incomes/application/save-income';
import { GetIncomes } from '@/features/incomes/application/get-incomes';
import { SyncIncomes } from '@/features/incomes/application/sync-incomes';
import { SqliteIncomeRepository } from '@/features/incomes/infrastructure/sqlite-income-repository';
import { CreateTransaction } from '@/features/transactions/application/create-transaction';
import { SqliteTransactionRepository } from '@/features/transactions/infrastructure/sqlite-transaction-repository';
import { migrate } from '@/shared/infrastructure/database/migrations';
import { SqliteUnitOfWork } from '@/shared/infrastructure/database/sqlite-unit-of-work';
import { openTestDb } from '@/shared/infrastructure/database/testing/sqlite-adapter';

import { SqliteBillRepository } from '../../infrastructure/sqlite-bill-repository';
import { GetPaymentPlan } from '../get-payment-plan';
import type { BillInput } from '../schemas';
import { SaveBill } from '../save-bill';
import { SyncOccurrences } from '../sync-occurrences';

const REF = '2026-11-15';

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
  const syncBills = new SyncOccurrences(bills);
  const syncIncomes = new SyncIncomes(incomes);
  const getIncomes = new GetIncomes(incomes);
  const nubank = one("SELECT id FROM accounts WHERE name = 'Nubank'");
  const salario = one("SELECT id FROM categories WHERE name = 'Salário'");
  const aluguel = one("SELECT id FROM categories WHERE name = 'Aluguel'");

  return {
    db,
    nubank,
    salario,
    aluguel,
    saveBill: new SaveBill(bills, syncBills, uow),
    saveIncome: new SaveIncome(incomes, syncIncomes, uow),
    createTransaction: new CreateTransaction(accounts, transactions, uow, () => 'g'),
    plan: new GetPaymentPlan(accounts, bills, getIncomes),
  };
}

const bill = (t: Awaited<ReturnType<typeof setup>>, over: Partial<BillInput> & { name: string }): BillInput => ({
  amountCents: 0,
  categoryId: t.aluguel,
  accountId: t.nubank,
  dueDay: 10,
  recurrence: 'monthly',
  startMonth: '2026-10',
  priority: 'important',
  ...over,
});

describe('GetPaymentPlan (real SQLite)', () => {
  it('pays the overdue essential first, then stops at the first bill the balance cannot cover', async () => {
    const t = await setup();
    // Rent from October: October is overdue, Nov/Dec/Jan are open.
    await t.saveBill.execute(bill(t, { name: 'Aluguel', amountCents: 80_000, priority: 'essential' }));
    // Streaming from November: three open occurrences.
    await t.saveBill.execute(bill(t, { name: 'Netflix', amountCents: 5_000, priority: 'flexible', dueDay: 20, startMonth: '2026-11' }));
    // Money in the bank: R$ 1.000,00.
    await t.createTransaction.execute({
      type: 'income',
      amountCents: 100_000,
      date: '2026-11-01',
      description: 'Entrada',
      categoryId: t.salario,
      accountId: t.nubank,
    });

    const plan = await t.plan.execute(REF);

    expect(plan.items[0]).toMatchObject({ order: 1, coveredByBalance: true, runningBalanceCents: 20_000 });
    expect(plan.items[0].occurrence).toMatchObject({ billName: 'Aluguel', overdue: true, dueDate: '2026-10-10' });
    // 10 Nov is also before 15 Nov: overdue, so it comes second among the overdue essentials.
    expect(plan.items[1].occurrence).toMatchObject({ billName: 'Aluguel', overdue: true, dueDate: '2026-11-10' });
    expect(plan.items[1].coveredByBalance).toBe(false);
    expect(plan.coveredCount).toBe(1);
    // Only this month and the overdue are in the plan: Aluguel of Out (80.000), Aluguel of Nov (80.000)
    // and Netflix of Nov (5.000) = 165.000 known. The balance is 100.000, so 65.000 is still missing.
    // Dec and Jan are materialized for reminders; they are not money due now, so they do not count.
    expect(plan.shortfallCents).toBe(65_000);
  });

  it('reports the next dated income and ignores receipts already in the past', async () => {
    const t = await setup();
    await t.saveIncome.execute({
      name: 'Salário',
      kind: 'fixed',
      expectedCents: 500_000,
      accountId: t.nubank,
      categoryId: t.salario,
      recurrence: 'monthly',
      dueDay: 5,
      startMonth: '2026-09',
    });

    const plan = await t.plan.execute(REF);

    expect(plan.items).toEqual([]);
    // 5 Nov has passed, so the next one is 5 Dec.
    expect(plan.nextIncome).toMatchObject({ name: 'Salário', expectedDate: '2026-12-05', expectedCents: 500_000 });
  });
});
