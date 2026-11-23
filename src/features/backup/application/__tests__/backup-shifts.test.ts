/**
 * Backup round trip with the driving-mode tables: they are exported, validated by the snapshot schema,
 * and restored into a fresh database in an order the foreign keys accept.
 */
import { SqliteBackupRepository } from '@/features/backup/infrastructure/sqlite-backup-repository';
import { migrate } from '@/shared/infrastructure/database/migrations';
import { SqliteUnitOfWork } from '@/shared/infrastructure/database/sqlite-unit-of-work';
import { openTestDb } from '@/shared/infrastructure/database/testing/sqlite-adapter';

import { BackupSnapshotSchema, type BackupFileGateway } from '../../domain/backup';
import { ExportBackup, ImportBackup } from '../backup-use-cases';

class MemoryFiles implements BackupFileGateway {
  contents: string | null = null;
  async share(_fileName: string, contents: string) {
    this.contents = contents;
  }
  async pick() {
    return this.contents;
  }
}

async function freshDb() {
  const { db, asDb } = openTestDb();
  await migrate(asDb());
  const repo = new SqliteBackupRepository(asDb(), new SqliteUnitOfWork(asDb()));
  return { db, repo };
}

describe('backup with driving-mode tables', () => {
  it('exports the rules, shifts and captures, and restores them into an empty database', async () => {
    const source = await freshDb();
    const nubank = (source.db.prepare("SELECT id FROM accounts WHERE name = 'Nubank'").get() as { id: number }).id;
    const ifood = (source.db.prepare("SELECT id FROM categories WHERE name = 'iFood'").get() as { id: number }).id;
    const ruleId = (source.db.prepare('SELECT id FROM notification_rules').get() as { id: number }).id;
    source.db
      .prepare("INSERT INTO shifts (started_at, ended_at, status, category_id, account_id, reported_total_cents) VALUES (?, ?, 'confirmed', ?, ?, 9000)")
      .run('2026-11-23T19:00:00.000Z', '2026-11-23T21:00:00.000Z', ifood, nubank);
    const shiftId = (source.db.prepare('SELECT id FROM shifts').get() as { id: number }).id;
    source.db
      .prepare(
        `INSERT INTO notification_captures (capture_key, package_name, title, text, posted_at, rule_id, amount_cents, payer, status, shift_id)
         VALUES ('k1', 'com.nu.production', 'Pix recebido', 'Você recebeu um Pix de R$ 32,90 de Maria S.', '2026-11-23T19:30:00.000Z', ?, 3290, 'Maria S', 'rejected', ?)`,
      )
      .run(ruleId, shiftId);

    const files = new MemoryFiles();
    await new ExportBackup(source.repo, files).execute();
    const json = JSON.parse(files.contents!);
    expect(BackupSnapshotSchema.safeParse(json).success).toBe(true);
    expect(json.tables.shifts).toHaveLength(1);
    expect(json.tables.notification_captures).toHaveLength(1);
    expect(json.tables.notification_rules).toHaveLength(1);

    const target = await freshDb();
    const result = await new ImportBackup(target.repo, files).execute();
    expect(result).toEqual({ imported: true, transactions: 0 });
    expect(target.db.prepare('SELECT status, reported_total_cents FROM shifts').get()).toEqual({
      status: 'confirmed',
      reported_total_cents: 9000,
    });
    expect(target.db.prepare('SELECT capture_key, status, payer, shift_id FROM notification_captures').get()).toEqual({
      capture_key: 'k1',
      status: 'rejected',
      payer: 'Maria S',
      shift_id: shiftId,
    });
  });

  it('restores an older backup (without these tables) with no shifts and the default Nubank rule', async () => {
    const target = await freshDb();
    const legacy = {
      app: 'app-financas',
      version: 1,
      exportedAt: new Date().toISOString(),
      tables: {
        accounts: [],
        categories: [],
        bills: [],
        bill_occurrences: [],
        transactions: [],
      },
    };
    const files = new MemoryFiles();
    files.contents = JSON.stringify(legacy);
    await new ImportBackup(target.repo, files).execute();
    expect((target.db.prepare('SELECT COUNT(*) AS n FROM shifts').get() as { n: number }).n).toBe(0);
    expect(
      target.db.prepare('SELECT package_name FROM notification_rules').all() as { package_name: string }[],
    ).toEqual([{ package_name: 'com.nu.production' }]);
  });
});
