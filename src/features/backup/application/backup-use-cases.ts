import { today } from '@/shared/domain/dates';
import { DomainError } from '@/shared/domain/errors';

import {
  BackupSnapshotSchema,
  type BackupFileGateway,
  type BackupRepository,
  type BackupSnapshot,
} from '../domain/backup';

export class ExportBackup {
  constructor(
    private readonly backup: BackupRepository,
    private readonly files: BackupFileGateway,
  ) {}

  async execute(): Promise<void> {
    const snapshot: BackupSnapshot = {
      app: 'app-financas',
      version: 1,
      exportedAt: new Date().toISOString(),
      tables: await this.backup.dump(),
    };
    await this.files.share(`financas-backup-${today()}.json`, JSON.stringify(snapshot));
  }
}

export type ImportResult = { imported: false } | { imported: true; transactions: number };

export class ImportBackup {
  constructor(
    private readonly backup: BackupRepository,
    private readonly files: BackupFileGateway,
  ) {}

  /** Replaces all data with the picked backup. */
  async execute(): Promise<ImportResult> {
    const contents = await this.files.pick();
    if (contents === null) return { imported: false };

    let json: unknown;
    try {
      json = JSON.parse(contents);
    } catch {
      throw new DomainError('Esse arquivo não é um backup do app. Escolha o .json exportado em Ajustes.');
    }
    const parsed = BackupSnapshotSchema.safeParse(json);
    if (!parsed.success) {
      throw new DomainError('Esse arquivo não é um backup do app. Escolha o .json exportado em Ajustes.');
    }
    await this.backup.restore(parsed.data.tables);
    return { imported: true, transactions: parsed.data.tables.transactions.length };
  }
}
