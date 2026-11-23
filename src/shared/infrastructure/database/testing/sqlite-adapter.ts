/// <reference types="node" />
import { DatabaseSync } from 'node:sqlite';

import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Test-only adapter: runs the app's SQL on a real SQLite (node:sqlite, Node >= 22.5)
 * behind the subset of the expo-sqlite API the repositories and migrate() use.
 * Accepts both call styles: runAsync(sql, [params]) and runAsync(sql, p1, p2).
 */
export function openTestDb() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');

  const params = (args: unknown[]): never[] => {
    const [first] = args;
    return (Array.isArray(first) ? first : args) as never[];
  };

  const adapter = {
    execAsync: async (sql: string) => {
      db.exec(sql);
    },
    getFirstAsync: async <T>(sql: string, ...args: unknown[]) =>
      ((db.prepare(sql).get(...params(args)) as T | undefined) ?? null),
    getAllAsync: async <T>(sql: string, ...args: unknown[]) => db.prepare(sql).all(...params(args)) as T[],
    runAsync: async (sql: string, ...args: unknown[]) => {
      const res = db.prepare(sql).run(...params(args));
      return { lastInsertRowId: Number(res.lastInsertRowid), changes: Number(res.changes) };
    },
    withTransactionAsync: async (work: () => Promise<void>) => {
      db.exec('BEGIN');
      try {
        await work();
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
  };

  return { db, adapter, asDb: () => adapter as unknown as SQLiteDatabase };
}

export type TestDb = ReturnType<typeof openTestDb>;
