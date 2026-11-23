/**
 * Shift use cases against real SQLite (migrations + repositories, no mocks of the database).
 * The clock is fixed at 2026-11-23 19:00 and moved with jest.setSystemTime. The native reader is replaced
 * by a fake source, so the tests check what would be watched and what would be stored.
 */
import { SqliteAccountRepository } from '@/features/accounts/infrastructure/sqlite-account-repository';
import { SqliteCategoryRepository } from '@/features/accounts/infrastructure/sqlite-category-repository';
import { CreateTransaction } from '@/features/transactions/application/create-transaction';
import { SqliteTransactionRepository } from '@/features/transactions/infrastructure/sqlite-transaction-repository';
import { DomainError, NotFoundError } from '@/shared/domain/errors';
import { migrate } from '@/shared/infrastructure/database/migrations';
import { SqliteUnitOfWork } from '@/shared/infrastructure/database/sqlite-unit-of-work';
import { openTestDb } from '@/shared/infrastructure/database/testing/sqlite-adapter';

import type { NotificationSource, RawCapture } from '../../domain/notification-source';
import { SqliteCaptureRepository } from '../../infrastructure/sqlite-capture-repository';
import { SqliteNotificationRuleRepository } from '../../infrastructure/sqlite-notification-rule-repository';
import { SqliteShiftRepository } from '../../infrastructure/sqlite-shift-repository';
import { ConfirmShift } from '../confirm-shift';
import { IngestCaptures } from '../ingest-captures';
import { SaveNotificationRule, DeleteNotificationRule, SyncWatchedPackages, ToggleNotificationRule } from '../notification-rules';
import { DiscardShift, EndShift, StartShift } from '../shift-lifecycle';
import { GetActiveShift, GetShiftReview, ListLearningCaptures, ListShifts } from '../shift-queries';
import { AssignCaptureToShift, SetReportedTotal, UpdateShiftCapture } from '../review-shift';

const at = (h: number, m: number) => new Date(2026, 10, 23, h, m, 0);
const NUBANK_APP = 'com.nu.production';

beforeAll(() => {
  jest.useFakeTimers({ now: at(19, 0) });
});
afterAll(() => {
  jest.useRealTimers();
});

class FakeSource implements NotificationSource {
  watched: string[] = [];
  isAvailable() {
    return true;
  }
  hasPermission() {
    return true;
  }
  openPermissionSettings() {}
  setWatchedPackages(packages: string[]) {
    this.watched = packages;
  }
  getWatchedPackages() {
    return this.watched;
  }
  drainCaptures(): RawCapture[] {
    return [];
  }
  addCaptureListener() {
    return { remove() {} };
  }
}

const raw = (key: string, when: Date, title: string | null, text: string | null, packageName = NUBANK_APP): RawCapture => ({
  key,
  packageName,
  title,
  text,
  bigText: null,
  postedAt: when.getTime(),
});

const FULANO = raw('k-fulano', at(19, 30), 'Transferência recebida', 'Você recebeu uma transferência de R$ 50,00 de FULANO DE TAL.');
const MARIA = raw('k-maria', at(20, 10), 'Pix recebido', 'Você recebeu um Pix de R$ 32,90 de Maria S.');
const COMPRA = raw('k-compra', at(20, 20), 'Compra aprovada', 'Compra aprovada de R$ 30,00 em IFOOD.');

async function setup() {
  jest.setSystemTime(at(19, 0)); // earlier tests move the clock; every test starts at 19:00
  const { db, asDb } = openTestDb();
  await migrate(asDb());
  const adapter = asDb();
  const one = (sql: string) => (db.prepare(sql).get() as { id: number }).id;

  const accounts = new SqliteAccountRepository(adapter);
  const categories = new SqliteCategoryRepository(adapter);
  const transactions = new SqliteTransactionRepository(adapter);
  const shifts = new SqliteShiftRepository(adapter);
  const captures = new SqliteCaptureRepository(adapter);
  const rules = new SqliteNotificationRuleRepository(adapter);
  const uow = new SqliteUnitOfWork(adapter);
  const source = new FakeSource();
  const sync = new SyncWatchedPackages(rules, source);
  let seq = 0;
  const createTransaction = new CreateTransaction(accounts, transactions, uow, () => `g${++seq}`);

  return {
    db,
    ids: {
      nubank: one("SELECT id FROM accounts WHERE name = 'Nubank'"),
      cartao: one("SELECT id FROM accounts WHERE name = 'Cartão Nubank'"),
      ifood: one("SELECT id FROM categories WHERE name = 'iFood'"),
      salario: one("SELECT id FROM categories WHERE name = 'Salário'"),
      combustivel: one("SELECT id FROM categories WHERE name = 'Combustível'"),
    },
    shifts,
    captures,
    rules,
    source,
    start: new StartShift(shifts, accounts, categories),
    end: new EndShift(shifts),
    discard: new DiscardShift(shifts, captures, uow),
    ingest: new IngestCaptures(rules, shifts, captures, uow),
    active: new GetActiveShift(shifts, captures),
    review: new GetShiftReview(shifts, captures),
    history: new ListShifts(shifts),
    learning: new ListLearningCaptures(captures),
    update: new UpdateShiftCapture(shifts, captures),
    assign: new AssignCaptureToShift(shifts, captures),
    setReported: new SetReportedTotal(shifts),
    confirm: new ConfirmShift(shifts, captures, createTransaction, uow),
    save: new SaveNotificationRule(rules, sync),
    remove: new DeleteNotificationRule(rules, sync),
    toggle: new ToggleNotificationRule(rules, sync),
    sync,
  };
}

type Ctx = Awaited<ReturnType<typeof setup>>;

/** Starts a moto shift at 19:00 (the clock's time). */
const startDefault = (s: Ctx) => s.start.execute({ categoryId: s.ids.ifood, accountId: s.ids.nubank });

describe('StartShift', () => {
  it('starts one active shift with the category, account and the current time', async () => {
    const s = await setup();
    const id = await startDefault(s);
    expect(await s.shifts.findActive()).toMatchObject({
      id,
      status: 'active',
      categoryId: s.ids.ifood,
      accountId: s.ids.nubank,
      startedAt: at(19, 0).toISOString(),
      endedAt: null,
    });
  });

  it('refuses a second shift while one is active', async () => {
    const s = await setup();
    await startDefault(s);
    await expect(startDefault(s)).rejects.toThrow(DomainError);
    expect((s.db.prepare("SELECT COUNT(*) AS n FROM shifts WHERE status = 'active'").get() as { n: number }).n).toBe(1);
  });

  it('keeps the rule in the database too: a second active row is refused by the partial unique index', async () => {
    const s = await setup();
    await startDefault(s);
    expect(() =>
      s.db
        .prepare(
          "INSERT INTO shifts (started_at, status, category_id, account_id) VALUES ('2026-11-23T20:00:00.000Z', 'active', ?, ?)",
        )
        .run(s.ids.ifood, s.ids.nubank),
    ).toThrow(/UNIQUE/);
  });

  it('accepts only an income category of the Moto group', async () => {
    const s = await setup();
    await expect(s.start.execute({ categoryId: s.ids.salario, accountId: s.ids.nubank })).rejects.toThrow(DomainError);
    await expect(s.start.execute({ categoryId: s.ids.combustivel, accountId: s.ids.nubank })).rejects.toThrow(DomainError);
    await expect(s.start.execute({ categoryId: 9999, accountId: s.ids.nubank })).rejects.toThrow(NotFoundError);
  });

  it('refuses a credit card and an unknown account', async () => {
    const s = await setup();
    await expect(s.start.execute({ categoryId: s.ids.ifood, accountId: s.ids.cartao })).rejects.toThrow(DomainError);
    await expect(s.start.execute({ categoryId: s.ids.ifood, accountId: 9999 })).rejects.toThrow(NotFoundError);
  });
});

describe('IngestCaptures', () => {
  it('stores nothing from apps without an active rule', async () => {
    const s = await setup();
    const added = await s.ingest.execute([raw('x', at(19, 30), 'Pix recebido', 'Você recebeu um Pix de R$ 9,00 de A.', 'com.whatsapp')]);
    expect(added).toBe(0);
    expect((s.db.prepare('SELECT COUNT(*) AS n FROM notification_captures').get() as { n: number }).n).toBe(0);
  });

  it('marks a payment outside any shift as outside_shift, and other notifications of the app as unmatched', async () => {
    const s = await setup();
    expect(await s.ingest.execute([FULANO, COMPRA])).toBe(2);
    const learning = await s.learning.execute();
    expect(learning.map((c) => [c.captureKey, c.status])).toEqual([
      ['k-compra', 'unmatched'],
      ['k-fulano', 'outside_shift'],
    ]);
    expect(learning[1]).toMatchObject({ amountCents: 5000, payer: 'FULANO DE TAL', ruleId: 1, shiftId: null });
  });

  it('marks a payment received during the active shift as in_shift, and one from before the start as outside_shift', async () => {
    const s = await setup();
    const shiftId = await startDefault(s);
    const beforeStart = raw('k-early', at(18, 50), 'Pix recebido', 'Você recebeu um Pix de R$ 7,00 de Lia.');
    await s.ingest.execute([FULANO, beforeStart]);
    const inShift = await s.captures.listByShift(shiftId);
    expect(inShift.map((c) => [c.captureKey, c.status])).toEqual([['k-fulano', 'in_shift']]);
    expect((await s.learning.execute()).map((c) => c.captureKey)).toEqual(['k-early']);
  });

  it('skips a notification that was already stored (same key), and reports only the new ones', async () => {
    const s = await setup();
    await startDefault(s);
    expect(await s.ingest.execute([FULANO])).toBe(1);
    expect(await s.ingest.execute([FULANO, MARIA])).toBe(1);
    expect((s.db.prepare('SELECT COUNT(*) AS n FROM notification_captures').get() as { n: number }).n).toBe(2);
  });

  it('does nothing for an empty batch', async () => {
    const s = await setup();
    expect(await s.ingest.execute([])).toBe(0);
  });
});

describe('GetActiveShift', () => {
  it('returns null when no shift is active', async () => {
    const s = await setup();
    expect(await s.active.execute()).toBeNull();
  });

  it('returns the running count, total and duration of the included captures', async () => {
    const s = await setup();
    await startDefault(s);
    jest.setSystemTime(at(20, 30));
    await s.ingest.execute([FULANO, MARIA, COMPRA]);
    jest.setSystemTime(at(21, 14));
    expect(await s.active.execute()).toMatchObject({ count: 2, totalCents: 8290, durationMinutes: 134 });
  });
});

describe('end, review, edit and confirm', () => {
  it('ends the shift into review, and refuses to end it twice', async () => {
    const s = await setup();
    const id = await startDefault(s);
    jest.setSystemTime(at(21, 0));
    await s.end.execute(id);
    expect(await s.shifts.findById(id)).toMatchObject({ status: 'reviewing', endedAt: at(21, 0).toISOString() });
    await expect(s.end.execute(id)).rejects.toThrow(DomainError);
    expect(await s.active.execute()).toBeNull();
  });

  it('reviews totals, the reported difference and the hourly rate', async () => {
    const s = await setup();
    const id = await startDefault(s);
    jest.setSystemTime(at(20, 30));
    await s.ingest.execute([FULANO, MARIA]);
    jest.setSystemTime(at(21, 0));
    await s.end.execute(id);

    let review = await s.review.execute(id);
    expect(review).toMatchObject({
      includedCount: 2,
      includedTotalCents: 8290,
      reportedTotalCents: null,
      differenceCents: null,
      durationMinutes: 120,
      hourlyCents: 4145,
    });

    await s.setReported.execute(id, 9000);
    review = await s.review.execute(id);
    expect(review).toMatchObject({ reportedTotalCents: 9000, differenceCents: 710 });
  });

  it('edits an amount, rejects and re-includes captures, and keeps the totals in step', async () => {
    const s = await setup();
    const id = await startDefault(s);
    jest.setSystemTime(at(20, 30));
    await s.ingest.execute([FULANO, MARIA]);
    const [fulano, maria] = await s.captures.listByShift(id);

    await s.update.execute(maria.id, { included: false });
    expect(await s.captures.findById(maria.id)).toMatchObject({ status: 'rejected' });
    await s.update.execute(fulano.id, { amountCents: 6000 });
    expect((await s.review.execute(id)).includedTotalCents).toBe(6000);

    await s.update.execute(maria.id, { included: true });
    expect((await s.review.execute(id)).includedTotalCents).toBe(6000 + 3290);
  });

  it('refuses to edit a capture that is not in a shift, or an unknown one', async () => {
    const s = await setup();
    await s.ingest.execute([FULANO]);
    const [outside] = await s.learning.execute();
    await expect(s.update.execute(outside.id, { included: false })).rejects.toThrow(DomainError);
    await expect(s.update.execute(9999, { included: false })).rejects.toThrow(NotFoundError);
  });

  it('pulls an outside_shift payment into the shift, and only that kind', async () => {
    const s = await setup();
    await s.ingest.execute([FULANO, COMPRA]);
    const id = await startDefault(s);
    const [outside] = (await s.learning.execute()).filter((c) => c.status === 'outside_shift');
    await s.assign.execute(outside.id, id);
    expect(await s.captures.findById(outside.id)).toMatchObject({ status: 'in_shift', shiftId: id });
    await expect(s.assign.execute(outside.id, id)).rejects.toThrow(DomainError);

    const unmatched = (await s.learning.execute()).find((c) => c.status === 'unmatched');
    await expect(s.assign.execute(unmatched!.id, id)).rejects.toThrow(DomainError);
  });

  it('confirms the included captures into income transactions, once', async () => {
    const s = await setup();
    const id = await startDefault(s);
    jest.setSystemTime(at(20, 30));
    await s.ingest.execute([FULANO, MARIA, COMPRA]);
    jest.setSystemTime(at(21, 0));
    await s.end.execute(id);
    const [fulano, maria] = await s.captures.listByShift(id);
    await s.update.execute(maria.id, { included: false });
    await s.update.execute(fulano.id, { amountCents: 6000 });

    expect(await s.confirm.execute(id)).toBe(1);

    const tx = s.db
      .prepare(
        `SELECT t.type, t.amount_cents, t.date, t.description, t.category_id, t.account_id, t.source, t.raw_text
         FROM transactions t JOIN notification_captures n ON n.transaction_id = t.id WHERE n.capture_key = 'k-fulano'`,
      )
      .get();
    expect(tx).toEqual({
      type: 'income',
      amount_cents: 6000,
      date: '2026-11-23',
      description: 'Pix · FULANO DE TAL',
      category_id: s.ids.ifood,
      account_id: s.ids.nubank,
      source: 'notification',
      raw_text: 'Transferência recebida\nVocê recebeu uma transferência de R$ 50,00 de FULANO DE TAL.',
    });
    expect(await s.captures.findById(fulano.id)).toMatchObject({ status: 'confirmed' });
    expect(await s.captures.findById(maria.id)).toMatchObject({ status: 'rejected', transactionId: null });
    expect(await s.shifts.findById(id)).toMatchObject({ status: 'confirmed' });

    const countTx = () => (s.db.prepare("SELECT COUNT(*) AS n FROM transactions WHERE source = 'notification'").get() as { n: number }).n;
    expect(countTx()).toBe(1);

    // Idempotent: a second confirm creates nothing and changes nothing.
    expect(await s.confirm.execute(id)).toBe(0);
    expect(countTx()).toBe(1);
  });

  it('describes a payment without a payer as "Pix recebido"', async () => {
    const s = await setup();
    const id = await startDefault(s);
    jest.setSystemTime(at(20, 0));
    await s.ingest.execute([raw('k-sem', at(19, 40), 'Pix recebido', 'Você recebeu R$ 12,00.')]);
    await s.end.execute(id);
    await s.confirm.execute(id);
    const row = s.db.prepare("SELECT description FROM transactions WHERE source = 'notification'").get();
    expect(row).toEqual({ description: 'Pix recebido' });
  });

  it('refuses to confirm an active shift, and any change after it was confirmed or discarded', async () => {
    const s = await setup();
    const id = await startDefault(s);
    jest.setSystemTime(at(20, 30));
    await s.ingest.execute([FULANO]);
    await expect(s.confirm.execute(id)).rejects.toThrow('Encerre o turno');

    jest.setSystemTime(at(21, 0));
    await s.end.execute(id);
    await s.confirm.execute(id);
    const [fulano] = await s.captures.listByShift(id);
    await expect(s.update.execute(fulano.id, { included: false })).rejects.toThrow('já foi confirmado');
    await expect(s.setReported.execute(id, 100)).rejects.toThrow('já foi confirmado');
    await expect(s.discard.execute(id)).rejects.toThrow(DomainError);
  });

  it('discards a shift: nothing from it becomes income', async () => {
    const s = await setup();
    const id = await startDefault(s);
    jest.setSystemTime(at(20, 30));
    await s.ingest.execute([FULANO]);
    await s.discard.execute(id);

    expect(await s.shifts.findById(id)).toMatchObject({ status: 'discarded' });
    expect(await s.active.execute()).toBeNull();
    expect(await s.captures.listByShift(id)).toMatchObject([{ status: 'rejected' }]);
    expect((s.db.prepare("SELECT COUNT(*) AS n FROM transactions WHERE source = 'notification'").get() as { n: number }).n).toBe(0);
    await expect(s.discard.execute(id)).rejects.toThrow(DomainError);
  });
});

describe('history and learning lists', () => {
  it('lists shifts newest first with totals, duration and hourly rate', async () => {
    const s = await setup();
    const id = await startDefault(s);
    jest.setSystemTime(at(20, 30));
    await s.ingest.execute([FULANO, MARIA]);
    jest.setSystemTime(at(21, 0));
    await s.end.execute(id);
    await s.confirm.execute(id);

    const [row] = await s.history.execute();
    expect(row).toMatchObject({
      categoryName: 'iFood',
      accountName: 'Nubank',
      count: 2,
      totalCents: 8290,
      durationMinutes: 120,
      hourlyCents: 4145,
    });
  });
});

describe('notification rules', () => {
  it('watches the apps of the active rules, and keeps the native reader in step', async () => {
    const s = await setup();
    await s.sync.execute();
    expect(s.source.watched).toEqual([NUBANK_APP]);

    const id = await s.save.execute({
      name: 'Banco Exemplo — Pix',
      packageName: 'com.exemplo.banco',
      textPattern: '(?<valor>\\d+,\\d{2})',
    });
    expect(s.source.watched.sort()).toEqual(['com.exemplo.banco', NUBANK_APP]);

    await s.toggle.execute(id);
    expect(s.source.watched).toEqual([NUBANK_APP]);
    await s.toggle.execute(id, true);
    expect(s.source.watched.sort()).toEqual(['com.exemplo.banco', NUBANK_APP]);

    await s.remove.execute(id);
    expect(s.source.watched).toEqual([NUBANK_APP]);
  });

  it('stops storing an app once its rule is off', async () => {
    const s = await setup();
    await startDefault(s);
    const nubank = (await s.rules.list())[0];
    await s.toggle.execute(nubank.id);
    expect(await s.ingest.execute([FULANO])).toBe(0);
    expect(s.source.watched).toEqual([]);
  });

  it('edits a rule in place', async () => {
    const s = await setup();
    const nubank = (await s.rules.list())[0];
    await s.save.execute({ name: 'Nubank — Pix', packageName: NUBANK_APP, textPattern: '(?<valor>\\d+,\\d{2})' }, nubank.id);
    expect(await s.rules.findById(nubank.id)).toMatchObject({ name: 'Nubank — Pix', textPattern: '(?<valor>\\d+,\\d{2})' });
    expect((await s.rules.list()).length).toBe(1);
  });

  it('refuses an invalid regex, a text pattern without a group, and a malformed package name', async () => {
    const s = await setup();
    await expect(
      s.save.execute({ name: 'x', packageName: 'com.exemplo.banco', textPattern: '(' }),
    ).rejects.toThrow(DomainError);
    await expect(
      s.save.execute({ name: 'x', packageName: 'com.exemplo.banco', textPattern: 'recebeu R\\$' }),
    ).rejects.toThrow('grupo');
    await expect(
      s.save.execute({ name: 'x', packageName: 'Nubank', textPattern: '(\\d+)' }),
    ).rejects.toThrow('Pacote inválido');
    await expect(
      s.save.execute({ name: 'x', packageName: 'com.exemplo.banco', titlePattern: '[', textPattern: '(\\d+)' }),
    ).rejects.toThrow('título');
  });
});
