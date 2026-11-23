import { z } from 'zod';

/** Tables in dependency order: restoring follows it, wiping goes in reverse. */
export const BACKUP_TABLES = [
  'accounts',
  'categories',
  'bills',
  'bill_occurrences',
  'transactions',
  'incomes',
  'income_occurrences',
  'notification_rules',
  'shifts',
  'notification_captures',
] as const;
export type BackupTable = (typeof BACKUP_TABLES)[number];

const rows = z.array(z.record(z.string(), z.union([z.string(), z.number(), z.null()])));
export type Row = z.infer<typeof rows>[number];

export const BackupSnapshotSchema = z.object({
  app: z.literal('app-financas'),
  version: z.literal(1),
  exportedAt: z.string(),
  tables: z.object({
    accounts: rows,
    categories: rows,
    bills: rows,
    bill_occurrences: rows,
    transactions: rows,
    // Added in schema v3. Older backups do not have them: they restore as empty lists.
    incomes: rows.default([]),
    income_occurrences: rows.default([]),
    // Added in schema v6 (driving mode). Older backups restore these as empty lists.
    notification_rules: rows.default([]),
    shifts: rows.default([]),
    notification_captures: rows.default([]),
  }),
});
export type BackupSnapshot = z.infer<typeof BackupSnapshotSchema>;

export interface BackupRepository {
  dump(): Promise<Record<BackupTable, Row[]>>;
  /** Replace every row of every table. Must be atomic. */
  restore(tables: Record<BackupTable, Row[]>): Promise<void>;
}

/** Port for getting the backup file in and out of the device. */
export interface BackupFileGateway {
  share(fileName: string, contents: string): Promise<void>;
  /** Returns the file contents, or null when the user cancels. */
  pick(): Promise<string | null>;
}
