import type { SQLiteDatabase } from 'expo-sqlite';

import type { UnitOfWork } from '@/shared/application/unit-of-work';
import { placeholders } from '@/shared/infrastructure/database/sql';

import { BACKUP_TABLES, type BackupRepository, type BackupTable, type Row } from '../domain/backup';

/** Columns are read from the live schema, so only known columns are ever written back. */
export class SqliteBackupRepository implements BackupRepository {
  constructor(
    private readonly db: SQLiteDatabase,
    private readonly uow: UnitOfWork,
  ) {}

  async dump() {
    const entries = await Promise.all(
      BACKUP_TABLES.map(async (t) => [t, await this.db.getAllAsync<Row>(`SELECT * FROM ${t}`)] as const),
    );
    return Object.fromEntries(entries) as Record<BackupTable, Row[]>;
  }

  async restore(tables: Record<BackupTable, Row[]>) {
    await this.uow.transaction(async () => {
      for (const t of [...BACKUP_TABLES].reverse()) {
        await this.db.runAsync(`DELETE FROM ${t}`);
      }
      for (const t of BACKUP_TABLES) {
        const columns = await this.columns(t);
        for (const row of tables[t] ?? []) {
          const cols = columns.filter((c) => c in row);
          await this.db.runAsync(
            `INSERT INTO ${t} (${cols.join(', ')}) VALUES (${placeholders(cols.length)})`,
            cols.map((c) => row[c] ?? null),
          );
        }
      }
    });
  }

  private async columns(table: BackupTable): Promise<string[]> {
    const info = await this.db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
    return info.map((c) => c.name);
  }
}
