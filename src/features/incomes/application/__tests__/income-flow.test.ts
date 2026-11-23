/**
 * Income use cases against real SQLite (migrations + repositories + use cases, no mocks).
 * The clock is fixed at 2026-11-15 so fixed schedules are deterministic.
 */
import { SqliteAccountRepository } from '@/features/accounts/infrastructure/sqlite-account-repository';
import { CreateTransaction } from '@/features/transactions/application/create-transaction';
import { DeleteTransaction } from '@/features/transactions/application/delete-transaction';
import { SqliteTransactionRepository } from '@/features/transactions/infrastructure/sqlite-transaction-repository';
import { migrate } from '@/shared/infrastructure/database/migrations';
import { SqliteUnitOfWork } from '@/shared/infrastructure/database/sqlite-unit-of-work';
import { openTestDb } from '@/shared/infrastructure/database/testing/sqlite-adapter';
import { DomainError } from '@/shared/domain/errors';

import { SqliteIncomeRepository } from '../../infrastructure/sqlite-income-repository';
import { AddExpectedIncome } from '../add-expected-income';
import { GetIncomes } from '../get-incomes';
import { ReceiveIncome } from '../receive-income';
import { SaveIncome, ArchiveIncome } from '../save-income';
import { SyncIncomes } from '../sync-incomes';

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
  const incomes = new SqliteIncomeRepository(adapter);
  const uow = new SqliteUnitOfWork(adapter);
  let seq = 0;
  const createTransaction = new CreateTransaction(accounts, transactions, uow, () => `g${++seq}`);
  const sync = new SyncIncomes(incomes);

  return {
    db,
    nubank: one("SELECT id FROM accounts WHERE name = 'Nubank'"),
    cartao: one("SELECT id FROM accounts WHERE name = 'Cartão Nubank'"),
    salario: one("SELECT id FROM categories WHERE name = 'Salário'"),
    accounts,
    incomes,
    save: new SaveIncome(incomes, sync, uow),
    archive: new ArchiveIncome(incomes, uow),
    addExpected: new AddExpectedIncome(incomes),
    receive: new ReceiveIncome(incomes, accounts, createTransaction, uow),
    deleteTransaction: new DeleteTransaction(transactions, incomes, uow),
    reads: new GetIncomes(incomes),
  };
}

type Ctx = Awaited<ReturnType<typeof setup>>;

const salaryInput = (t: Ctx, over: Partial<Parameters<Ctx['save']['execute']>[0]> = {}) => ({
  name: 'Salário',
  kind: 'fixed' as const,
  expectedCents: 500_000,
  accountId: t.nubank,
  categoryId: t.salario,
  recurrence: 'monthly' as const,
  dueDay: 5,
  startMonth: '2026-09',
  note: null,
  ...over,
});

const bolsaInput = (t: Ctx) => ({
  name: 'Bolsa',
  kind: 'uncertain' as const,
  expectedCents: 300_000,
  accountId: t.nubank,
  categoryId: t.salario,
});

describe('fixed incomes', () => {
  it('materialize one occurrence per due date from the start month through two months ahead', async () => {
    const t = await setup();
    await t.save.execute(salaryInput(t));

    const dates = (await t.reads.pending()).map((o) => o.expectedDate);
    expect(dates).toEqual(['2026-09-05', '2026-10-05', '2026-11-05', '2026-12-05', '2027-01-05']);
  });

  it('receiving creates an income transaction, closes the occurrence and credits the account', async () => {
    const t = await setup();
    await t.save.execute(salaryInput(t));
    const nov = (await t.reads.pending()).find((o) => o.expectedDate === '2026-11-05')!;

    const txId = await t.receive.execute(nov.id, { amountCents: 500_000, date: '2026-11-05', accountId: t.nubank });

    const tx = t.db
      .prepare('SELECT type, amount_cents, category_id, description, account_id FROM transactions WHERE id = ?')
      .get(txId);
    expect(tx).toEqual({ type: 'income', amount_cents: 500_000, category_id: t.salario, description: 'Salário', account_id: t.nubank });

    const closed = await t.incomes.findOccurrence(nov.id);
    expect(closed).toMatchObject({ status: 'received', receivedTransactionId: txId });
    expect((await t.reads.pending()).map((o) => o.id)).not.toContain(nov.id);

    const balance = (await t.accounts.balances(REF)).find((b) => b.id === t.nubank);
    expect(balance?.balanceCents).toBe(500_000);
  });

  it('refuses to receive the same occurrence twice, and refuses credit card accounts', async () => {
    const t = await setup();
    await t.save.execute(salaryInput(t));
    const [first, second] = await t.reads.pending();

    await t.receive.execute(first.id, { amountCents: 500_000, date: REF, accountId: t.nubank });
    await expect(t.receive.execute(first.id, { amountCents: 500_000, date: REF, accountId: t.nubank })).rejects.toThrow(
      'Essa entrada já foi recebida',
    );
    await expect(t.receive.execute(second.id, { amountCents: 500_000, date: REF, accountId: t.cartao })).rejects.toThrow(
      'Uma entrada não pode cair em cartão de crédito',
    );
  });

  it('editing the amount rebuilds open occurrences and keeps the received history as it was', async () => {
    const t = await setup();
    const id = await t.save.execute(salaryInput(t));
    const [nov] = (await t.reads.pending()).filter((o) => o.expectedDate === '2026-11-05');
    await t.receive.execute(nov.id, { amountCents: 500_000, date: '2026-11-05', accountId: t.nubank });

    await t.save.execute(salaryInput(t, { expectedCents: 600_000 }), id);

    const pending = await t.reads.pending();
    expect(pending.every((o) => o.expectedCents === 600_000)).toBe(true);
    expect(pending.map((o) => o.expectedDate)).toEqual(['2026-09-05', '2026-10-05', '2026-12-05', '2027-01-05']);
    expect((await t.incomes.findOccurrence(nov.id))?.expectedCents).toBe(500_000);
  });

  it('deleting the receipt transaction puts the occurrence back to pending', async () => {
    const t = await setup();
    await t.save.execute(salaryInput(t));
    const nov = (await t.reads.pending()).find((o) => o.expectedDate === '2026-11-05')!;
    const txId = await t.receive.execute(nov.id, { amountCents: 500_000, date: '2026-11-05', accountId: t.nubank });

    await t.deleteTransaction.execute(txId);

    expect(await t.incomes.findOccurrence(nov.id)).toMatchObject({ status: 'pending', receivedTransactionId: null });
  });

  it('expected income of a month sums fixed and tagged uncertain occurrences, received or not', async () => {
    const t = await setup();
    await t.save.execute(salaryInput(t));
    const bolsa = await t.save.execute(bolsaInput(t));
    await t.addExpected.execute({ incomeId: bolsa, month: '2026-12' });
    await t.addExpected.execute({ incomeId: bolsa, month: '2026-12' });
    await t.addExpected.execute({ incomeId: bolsa, month: null, expectedCents: 120_000 });

    expect(await t.reads.expectedCents('2026-12')).toBe(500_000 + 300_000 + 300_000);

    const dec = (await t.reads.pending()).find((o) => o.expectedDate === '2026-12-05')!;
    await t.receive.execute(dec.id, { amountCents: 500_000, date: '2026-12-05', accountId: t.nubank });
    expect(await t.reads.expectedCents('2026-12')).toBe(1_100_000);
  });

  it('requires a schedule for fixed incomes', async () => {
    const t = await setup();
    await expect(t.save.execute(salaryInput(t, { dueDay: null }))).rejects.toThrow('Informe o dia em que costuma cair');
  });

  it('cannot change kind after creation', async () => {
    const t = await setup();
    const id = await t.save.execute(salaryInput(t));
    await expect(t.save.execute(bolsaInput(t), id)).rejects.toThrow('O tipo da renda não pode mudar depois de criada');
  });

  it('adding a loose occurrence to a fixed income is refused', async () => {
    const t = await setup();
    const id = await t.save.execute(salaryInput(t));
    await expect(t.addExpected.execute({ incomeId: id, month: '2026-12' })).rejects.toBeInstanceOf(DomainError);
  });
});

describe('uncertain incomes', () => {
  it('several waiting occurrences can be pending at once, dated ones first and undated last', async () => {
    const t = await setup();
    const bolsa = await t.save.execute(bolsaInput(t));
    await t.addExpected.execute({ incomeId: bolsa, month: '2026-12' });
    await t.addExpected.execute({ incomeId: bolsa, month: null, expectedCents: 120_000 });

    const pending = await t.reads.pending();
    expect(pending).toHaveLength(2);
    expect(pending.map((o) => o.expectedCents)).toEqual([300_000, 120_000]);
    expect(pending.map((o) => o.month)).toEqual(['2026-12', null]);
    expect(pending.every((o) => o.expectedDate === null)).toBe(true);
  });

  it('is never generated by the schedule, and archiving drops its open occurrences', async () => {
    const t = await setup();
    const bolsa = await t.save.execute(bolsaInput(t));
    await t.addExpected.execute({ incomeId: bolsa, month: null });
    expect((await t.reads.pending()).length).toBe(1);

    await t.archive.execute(bolsa);
    expect(await t.reads.pending()).toEqual([]);
    expect(await t.reads.list()).toEqual([]);
  });
});
