import type { SQLiteDatabase } from 'expo-sqlite';

import type { UnitOfWork } from '@/shared/application/unit-of-work';

/**
 * Uses withTransactionAsync (same connection) so foreign keys stay enforced.
 * Nested calls run inside the outer transaction instead of opening a new one.
 */
export class SqliteUnitOfWork implements UnitOfWork {
  private depth = 0;

  constructor(private readonly db: SQLiteDatabase) {}

  async transaction<T>(work: () => Promise<T>): Promise<T> {
    if (this.depth > 0) return work();
    this.depth++;
    try {
      let result!: T;
      await this.db.withTransactionAsync(async () => {
        result = await work();
      });
      return result;
    } finally {
      this.depth--;
    }
  }
}
